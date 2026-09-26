# HireSphere AI &mdash; Frontend Client
### Autonomous Real-Time Talent & Placement Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.1_Flash_Lite-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

HireSphere AI is an intelligent recruitment, placement, and mock interview preparation SPA. Powered by **React 19**, **Vite 8**, **Server-Sent Events (SSE)**, and **Google Gemini AI**, it delivers instantaneous multi-turn technical interview coaching, automated candidate screening, and real-time hiring pipeline synchronization.

---

## 🌐 Deployment Endpoints

| Service | Environment / Host | Endpoint URL | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | Edge CDN | `https://<your-frontend-domain>.vercel.app` | Production Single Page Application |
| **Backend REST API** | Cloud Container | `https://<your-backend-domain>.onrender.com/api` | Primary Spring Boot API Gateway |
| **Real-Time Event Stream** | Server-Sent Events (SSE) | `https://<your-backend-domain>.onrender.com/api/realtime/stream` | Persistent unidirectional event bus |
| **Interactive API Docs** | Swagger UI | `https://<your-backend-domain>.onrender.com/swagger-ui.html` | Interactive REST testing console |

---

## 🚀 Key Features

### 1. 🤖 Interactive AI Mock Interview Coach (`/ai-interview`)
- **Dynamic Topic Adaptation**: The AI agent adapts dynamically to custom topics (e.g., Object-Oriented Programming, System Architecture, Multithreading) with tailored scenario questions (e.g. testing polymorphism in payment processing).
- **STAR Methodology Evaluation**: Analyzes candidate answers against Situation, Task, Action, and Result parameters with running 0–100 scores.
- **Isolated Viewport UX**: Integrated container-only scrolling prevents page-level jumps or window displacement during typing and message submission.
- **Continuous Focus**: Preserves keyboard focus on the response input after submission for rapid turn-by-turn interview simulation.

### 2. ⚡ Real-Time Pipeline Synchronization
- Connects automatically to the backend SSE event bus (`/api/realtime/stream`).
- When a recruiter shortlists an application or schedules an interview, candidate badges and notifications update **instantly without page reload**.

### 3. 💼 Candidate & Recruiter Dashboards
- **Candidate Portal**: Search and filter vacancies, track multi-stage applications (`APPLIED` → `REVIEWING` → `SHORTLISTED` → `INTERVIEW_SCHEDULED` → `ACCEPTED`/`REJECTED`), and save jobs.
- **Recruiter Portal**: 1-Click AI job description generation, autonomous applicant scoring (`/api/ai/screen`), candidate ranking, and calendar scheduling.

---

## 📂 Project Architecture

```
frontend/
├── public/                 # Static assets and icons
├── src/
│   ├── api/
│   │   ├── axiosClient.js  # Centralized Axios instance with timeout and interceptors
│   │   └── endpoints.js    # Unified endpoint registry
│   ├── context/
│   │   ├── AuthContext.jsx # RBAC state, tokens, and user profile management
│   │   └── RealtimeContext.jsx # Live SSE EventSource listener
│   ├── pages/
│   │   ├── AiInterview.jsx # Interactive AI Mock Interview chamber
│   │   ├── Jobs.jsx        # Job discovery & search
│   │   ├── JobDetails.jsx  # Job spec & 1-click application
│   │   ├── PostJob.jsx     # Recruiter job creator with AI generation
│   │   ├── Applications.jsx# Pipeline tracker
│   │   ├── Login.jsx       # User authentication
│   │   └── Register.jsx    # Role-based onboarding
│   ├── services/
│   │   ├── aiService.js    # AI orchestration & dynamic fallback cascade
│   │   ├── geminiClient.js # Direct low-latency Google Gemini 3.1 client
│   │   ├── jobService.js   # Job management HTTP services
│   │   └── applicationService.js # Application submission & review services
│   ├── App.jsx             # React Router routing topology
│   └── main.jsx            # React root mount
├── .env.example            # Environment template (Zero secrets)
├── package.json
└── vite.config.js          # Vite build configuration & local dev proxy
```

---

## ⚙️ Environment Configuration (`.env.example`)

Create a `.env` file in the root of the `frontend` directory using the template below:

```env
# Application Brand & Ports
VITE_APP_NAME="HireSphere AI"
VITE_APP_TAGLINE="Autonomous Real-Time Talent & Placement Platform"
VITE_PORT=5175
VITE_BACKEND_PORT=8085

# Centralized API & Real-Time Endpoints
# Production:
VITE_API_BASE_URL=https://<your-backend-domain>.onrender.com/api
VITE_REALTIME_STREAM_URL=https://<your-backend-domain>.onrender.com/api/realtime/stream
VITE_SWAGGER_URL=https://<your-backend-domain>.onrender.com/swagger-ui.html
VITE_H2_CONSOLE_URL=https://<your-backend-domain>.onrender.com/h2-console

# Local Development:
# VITE_API_BASE_URL=http://localhost:8085/api
# VITE_REALTIME_STREAM_URL=http://localhost:8085/api/realtime/stream

# Feature Flags
VITE_ENABLE_REALTIME_EVENTS=true
VITE_ENABLE_AI_MOCK_INTERVIEW=true
VITE_ENABLE_AI_CANDIDATE_SCREENING=true
VITE_ENABLE_AI_JOB_GENERATOR=true

# Google Gemini AI (Optional client-side key for direct LLM inference)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)

### Installation & Run
```bash
# 1. Clone repository
git clone https://github.com/<your-username>/HireSphereAI-FrontEnd.git
cd HireSphereAI-FrontEnd

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

The application will be running at **`http://localhost:5175`**.

### Production Build
```bash
# Verify bundle integrity and build production assets
npm run build

# Preview production build locally
npm run preview
```

---

## 🔑 Demo Test Accounts

The platform includes demo accounts for evaluation:

| Role | Email | Password | Pre-loaded Context |
| :--- | :--- | :--- | :--- |
| **Candidate** | `candidate@example.com` | `candidate123` | Full-Stack profile, active applications |
| **Recruiter** | `recruiter@example.com` | `recruiter123` | HR director, published job listings |
| **Admin** | `admin@example.com` | `admin123` | Administrative oversight |

---

## 📄 License
This project is licensed under the MIT License &mdash; see the LICENSE file for details.
