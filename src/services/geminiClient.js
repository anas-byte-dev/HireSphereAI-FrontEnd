/**
 * geminiClient.js - Direct Google Gemini Client for HireSphere AI
 * Supports Gemini 1.5 Flash / Gemini 2.0 with automatic response sanitization,
 * localStorage key override, and flexible JSON extraction.
 */

const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-1.5-flash',
];
const DEFAULT_MODEL = 'gemini-3.5-flash';

export const getGeminiApiKey = () => {
  return (
    localStorage.getItem('hiresphere_gemini_api_key') ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    ''
  ).trim();
};

export const setGeminiApiKey = (key) => {
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
 * Call Gemini REST generateContent API directly with multi-model fallback
 */
async function callGeminiApi(prompt, model = DEFAULT_MODEL) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('No Gemini API key configured. Please set VITE_GEMINI_API_KEY or configure in dashboard.');
  }

  const modelsToTry = [model, ...CANDIDATE_MODELS.filter((m) => m !== model)];
  let lastError = null;

  for (const m of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      });

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
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini API returned an empty response.');
      }

      return text;
    } catch (e) {
      lastError = e;
      if (
        e.message &&
        (e.message.includes('not found') ||
          e.message.includes('not supported') ||
          e.message.includes('high demand') ||
          e.message.includes('no longer available'))
      ) {
        continue;
      }
      throw e;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed to respond.');
}

/**
 * Cleanly extracts JSON object or array from a string, stripping markdown fences
 */
function extractJson(text) {
  if (!text) return null;
  // Remove markdown code fences if present
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

  const raw = await callGeminiApi(prompt);
  const parsed = extractJson(raw);
  return {
    title: parsed.title || title,
    description: parsed.description || '',
    requirements: Array.isArray(parsed.requirements) ? parsed.requirements.join('\n') : (parsed.requirements || ''),
    recommendedSalary: parsed.recommendedSalary || '₹10 - 18 LPA',
    suggestedSkills: Array.isArray(parsed.suggestedSkills) ? parsed.suggestedSkills : targetSkills,
    generatedBy: 'Gemini 1.5 Flash (Direct AI)',
  };
}

/**
 * Agent 2: Interactive AI Mock Interviewer Turn
 */
export async function geminiInterviewTurn({ jobRole, history = [], userMessage }) {
  const conversationContext = history
    .slice(-6)
    .map((m) => `${m.sender === 'AI' ? 'Interviewer' : 'Candidate'}: ${m.message}`)
    .join('\n');

  const prompt = `You are a distinguished Principal Engineer and Technical Hiring Manager conducting an interactive technical mock interview for the position: "${jobRole}".

Recent Conversation:
${conversationContext}

Candidate just said:
"${userMessage}"

Evaluate their response with constructive coaching, and provide the next realistic interview question.
Respond in strict JSON with ONLY these keys:
{
  "score": 85,
  "feedback": "1-2 constructive coaching sentences highlighting strengths and how to improve",
  "message": "Your conversational reply followed by the next insightful technical or scenario-based interview question"
}`;

  const raw = await callGeminiApi(prompt);
  const parsed = extractJson(raw);
  return {
    score: typeof parsed.score === 'number' ? Math.min(100, Math.max(0, parsed.score)) : 82,
    feedback: parsed.feedback || 'Great explanation. Ensure you articulate quantifiable metrics and trade-offs.',
    message: parsed.message || 'Well stated! How would you handle system resilience under unexpected network partition?',
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

  const raw = await callGeminiApi(prompt);
  return extractJson(raw);
}
