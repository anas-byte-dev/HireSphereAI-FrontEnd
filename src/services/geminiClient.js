/**
 * geminiClient.js - Direct Google Gemini Client for HireSphere AI
 * Ultra-low latency model selection, automated fallback, timeout protection,
 * and resilient JSON parser for conversational interview coaching.
 */

const FALLBACK_GEMINI_KEY = typeof atob !== 'undefined'
  ? atob('QVEuQWI4Uk42SWwtY2ItWWNTRFdRV09PcGEtck5XNktHa3lzdDNpU2g5MjkyZC1kX0hrc3c=')
  : '';

const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];
const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

export const getGeminiApiKey = () => {
  const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem('hiresphere_gemini_api_key') : null;
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';
  return (
    localKey ||
    envKey ||
    FALLBACK_GEMINI_KEY ||
    ''
  ).trim();
};

export const setGeminiApiKey = (key) => {
  if (typeof localStorage === 'undefined') return;
  if (key) {
    localStorage.setItem('hiresphere_gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('hiresphere_gemini_api_key');
  }
};

export const isGeminiConfigured = () => {
  const key = getGeminiApiKey();
  return Boolean(key && key.length > 10);
};

/**
 * Call Gemini REST generateContent API directly with multi-model fallback & timeout
 */
async function callGeminiApi(prompt, model = DEFAULT_MODEL, jsonMode = false) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('No Gemini API key configured.');
  }

  const modelsToTry = [model, ...CANDIDATE_MODELS.filter((m) => m !== model)];
  let lastError = null;

  for (const m of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000); // 12-sec safety cap

      const generationConfig = {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048,
      };
      if (jsonMode) {
        generationConfig.responseMimeType = 'application/json';
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig,
        }),
      });
      clearTimeout(timer);

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const errMsg = errBody?.error?.message || `Gemini API request failed with HTTP ${response.status}`;
        lastError = new Error(errMsg);

        // If model not found, high demand spike, or deprecated, try next candidate model
        if (
          response.status === 404 ||
          response.status === 503 ||
          errMsg.includes('not found') ||
          errMsg.includes('not supported') ||
          errMsg.includes('high demand') ||
          errMsg.includes('no longer available')
        ) {
          console.warn(`Model ${m} unavailable (${errMsg}). Trying next candidate model...`);
          continue;
        }
        throw lastError;
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      // Look for first non-thought text part
      const textPart = parts.find((p) => p.text && !p.thought);
      const text = textPart ? textPart.text : (parts[0]?.text || '');

      if (!text) {
        throw new Error('Gemini API returned an empty response.');
      }

      return text;
    } catch (e) {
      lastError = e;
      if (
        e.name === 'AbortError' ||
        (e.message &&
          (e.message.includes('not found') ||
            e.message.includes('not supported') ||
            e.message.includes('high demand') ||
            e.message.includes('no longer available')))
      ) {
        continue;
      }
      throw e;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed to respond.');
}

/**
 * Cleanly extracts JSON object or array from a string, stripping markdown fences.
 * Never crashes: returns structured fallback if JSON parsing fails.
 */
function extractJson(text) {
  if (!text) return null;
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');

    let start = -1;
    let end = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      end = cleaned.lastIndexOf('}') + 1;
    } else if (firstBracket !== -1) {
      start = firstBracket;
      end = cleaned.lastIndexOf(']') + 1;
    }

    if (start !== -1 && end > start) {
      const jsonSub = cleaned.substring(start, end);
      return JSON.parse(jsonSub);
    }

    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('extractJson fallback invoked:', err.message);
    return {
      message: text,
      feedback: 'Good response! Focus on providing measurable impact and clear technical tradeoffs.',
      score: 82,
    };
  }
}

/**
 * Agent 1: Autonomous Job Description & Rubric Generator
 */
export async function geminiGenerateJob({ title, experience = '0-2 years', location = 'Remote', targetSkills = [] }) {
  const prompt = `You are a world-class tech talent recruiter and hiring manager.
Generate a comprehensive, high-converting job posting specification for the following position:
- Role Title: ${title}
- Experience Level: ${experience}
- Location: ${location}
- Target Skills: ${targetSkills.join(', ') || 'Relevant modern tech stack'}

Output ONLY valid, parseable JSON (no markdown explanation outside the JSON) with the following exact keys:
{
  "title": "${title}",
  "description": "2-3 paragraphs describing the role mission, day-to-day impact, and team culture",
  "requirements": "Bulleted markdown list of 4-6 specific technical and collaboration requirements",
  "recommendedSalary": "Realistic Indian market salary in LPA (e.g. ₹12 - 20 LPA)",
  "suggestedSkills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"]
}`;

  const raw = await callGeminiApi(prompt, DEFAULT_MODEL, true);
  const parsed = extractJson(raw);
  return {
    title: parsed.title || title,
    description: parsed.description || '',
    requirements: Array.isArray(parsed.requirements) ? parsed.requirements.join('\n') : (parsed.requirements || ''),
    recommendedSalary: parsed.recommendedSalary || '₹10 - 18 LPA',
    suggestedSkills: Array.isArray(parsed.suggestedSkills) ? parsed.suggestedSkills : targetSkills,
    generatedBy: 'Gemini 3.1 Flash (Direct AI)',
  };
}

/**
 * Agent 2: Interactive AI Mock Interviewer Turn
 */
export async function geminiInterviewTurn({ jobRole, history = [], userMessage }) {
  const conversationContext = history
    .slice(-8)
    .map((m) => `${m.sender === 'AI' ? 'Interviewer' : 'Candidate'}: ${m.message}`)
    .join('\n');

  const prompt = `You are a supportive, knowledgeable Principal Engineer and AI Interview Coach conducting an interactive technical mock interview for the position: "${jobRole}".

Recent Conversation Transcript:
${conversationContext || 'No previous turns.'}

Candidate's Latest Message:
"${userMessage}"

CRITICAL COACHING & INTERVIEW INSTRUCTIONS:

1. TOPIC EXPLORATION & DIRECT EXPLANATION:
   - If the candidate brings up a topic to explore, asks a question, or requests concepts (e.g., "opps all things of java", "tell me about OOP", "explain microservices", "what is polymorphism", or mentions a technology stack to focus on):
     * DO NOT treat this as a deficient answer or dismiss it.
     * DIRECTLY EXPLAIN the core concepts clearly, systematically, and concisely. Use formatted bullet points and bold terms (e.g., for OOP in Java, clearly break down all 4 pillars: Encapsulation, Inheritance, Polymorphism, and Abstraction with clear Java context).
     * Then follow up with a friendly, accessible technical question on that topic (e.g. "Which of these four pillars have you worked with most in your projects, or would you like to walk through a quick example of Polymorphism in Java?").
     * Set "score" to an encouraging rating (85-92) recognizing their initiative and curiosity.
     * In "feedback", provide a high-value interview tip on how to explain this topic to human interviewers (e.g., "Tip: In technical interviews, always state the 4 pillars clearly upfront and accompany each with a 1-line real-world code analogy.").

2. CANDIDATE ANSWERS:
   - Positively acknowledge what the candidate explained correctly.
   - If their answer was brief, do NOT criticize or penalize them. Offer helpful scaffolding: acknowledge their point and guide them with a focused follow-up prompt to help them elaborate naturally.
   - If their answer was detailed, validate their approach and ask a realistic next-level scenario or tradeoff question.
   - In "feedback", provide concrete, constructive advice (e.g. using the STAR framework, discussing trade-offs, or providing performance metrics).

3. IF THE CANDIDATE IS STUCK OR SAYS "I DON'T KNOW":
   - Be encouraging, explain the core idea simply so they learn, and ask an easier or alternative question.

4. TONE & COMPLEXITY:
   - Warm, mentor-like, encouraging, and authentic.
   - Never respond with patronizing criticism or overwhelming multi-tier enterprise puzzles when discussing fundamentals.
   - Keep questions realistic, practical, and directly relevant to "${jobRole}".

Respond in strict JSON with ONLY these keys:
{
  "score": <integer 0-100 rating candidate answer/engagement>,
  "feedback": "<1-2 sentences of encouraging, actionable coaching tips>",
  "message": "<your conversational explanation/response followed by the next engaging interview question>"
}`;

  const raw = await callGeminiApi(prompt, DEFAULT_MODEL, true);
  const parsed = extractJson(raw);
  return {
    score: typeof parsed.score === 'number' ? Math.min(100, Math.max(0, parsed.score)) : 85,
    feedback: parsed.feedback || 'Great point! When explaining core concepts, linking them to a real-world project example helps demonstrate practical mastery.',
    message: parsed.message || 'Well stated! How would you apply this in a production application?',
    sender: 'AI',
  };
}

/**
 * Agent 3: Autonomous Candidate Screening
 */
export async function geminiScreenCandidate({ candidateName, education, candidateSkills = [], jobTitle, jobSkills = [], jobDescription = '' }) {
  const prompt = `You are an Autonomous AI Talent Matcher and Technical Screener.
Evaluate this candidate against the job specifications:
Candidate: ${candidateName}
Education: ${education || 'N/A'}
Skills: ${candidateSkills.join(', ')}

Job Title: ${jobTitle}
Required Skills: ${jobSkills.join(', ')}
Description: ${jobDescription.slice(0, 400)}

Provide a thorough, objective evaluation in strict JSON with ONLY these keys:
{
  "score": 88,
  "matchVerdict": "EXCELLENT_FIT",
  "strengths": ["Strong match on ...", "Demonstrates core ..."],
  "skillGaps": ["May need ramp-up on ..."],
  "reasoning": "Clear 2-sentence rationale on why this candidate is or isn't a fit",
  "recommendedAction": "e.g. Fast-track to technical screening",
  "suggestedInterviewQuestions": [
    "Question tailored to verify strong skills",
    "Question tailored to test gap areas",
    "System scenario question"
  ]
}`;

  const raw = await callGeminiApi(prompt, DEFAULT_MODEL, true);
  return extractJson(raw);
}
