# HireSphere AI - Frontend Client

Autonomous Real-Time Talent & Placement Platform frontend built with React, Vite, Tailwind CSS, Supabase, and Google Gemini AI.

---

## Live Deployment & Cloud Endpoints

| Service | Environment | Live URL |
|---|---|---|
| **Production Frontend** | Vercel | [https://hire-sphere-ai-front-end.vercel.app](https://hire-sphere-ai-front-end.vercel.app) |
| **Backend REST API** | Render Cloud | [https://hiresphereai.onrender.com/api](https://hiresphereai.onrender.com/api) |
| **Real-time Event Stream (SSE)** | Render Cloud | [https://hiresphereai.onrender.com/api/realtime/stream](https://hiresphereai.onrender.com/api/realtime/stream) |
| **Interactive API Documentation** | Swagger UI | [https://hiresphereai.onrender.com/swagger-ui.html](https://hiresphereai.onrender.com/swagger-ui.html) |
| **Embedded Database Web Console** | H2 Console | [https://hiresphereai.onrender.com/h2-console](https://hiresphereai.onrender.com/h2-console) |

---

## Environment Configuration

See `.env.example` for all configurable keys.

```env
# Primary Cloud Backend REST API
VITE_API_BASE_URL=https://hiresphereai.onrender.com/api

# Live Server-Sent Events (SSE) Stream
VITE_REALTIME_STREAM_URL=https://hiresphereai.onrender.com/api/realtime/stream

# Swagger UI Documentation
VITE_SWAGGER_URL=https://hiresphereai.onrender.com/swagger-ui.html

# Database Web Console
VITE_H2_CONSOLE_URL=https://hiresphereai.onrender.com/h2-console

# Supabase Realtime & Auth
VITE_SUPABASE_URL=https://esbvwqjdabcmbqubfffi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini AI (Client-side Direct Acceleration)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Build for production
npm run build
```
Local development server runs on `http://localhost:5175` and automatically connects to the live Render backend at `https://hiresphereai.onrender.com/api`.
