# HireSphere AI &mdash; System Architecture & Workflow Specification

This document details the architectural topology, component interactions, data model, state machines, and execution workflows of the **HireSphere AI Platform**.

---

## 1. High-Level System Architecture

HireSphere AI utilizes a decoupled, modern multi-tier architecture featuring a **Vite + React SPA**, an **Enterprise Spring Boot REST API**, a **Disk-Persistent Hybrid DBMS Engine**, and an **Autonomous Agentic AI Subsystem** powered by Google Gemini with local heuristic failover.

```mermaid
graph TD
    subgraph ClientLayer ["Client Layer (Web Browsers)"]
        A[React 19 SPA<br/>Vite 8, Context API]
        SSE_Client[EventSource SSE Client]
    end

    subgraph GatewayAndService ["Application & Service Tier (Spring Boot 3.2.5)"]
        REST[REST API Controllers<br/>/api/*]
        AuthService[Auth & User Service]
        JobService[Job Management Service]
        AppService[Application Workflow Engine]
        SSE_Bus[RealtimeEventService<br/>SSE Broadcaster]
        AiService[GeminiAiService<br/>Autonomous Agentic Engine]
    end

    subgraph DataTier ["Persistence Tier (DBMS)"]
        H2[(Persistent H2 DBMS<br/>data/hiresphere_realtime_db)]
        JSON_DB[(JSON Snapshot Engine<br/>hiresphere_realtime_db.json)]
    end

    subgraph ExternalAI ["External AI Infrastructure"]
        Gemini[Google Gemini API v1beta<br/>Models: gemini-3.1-flash-lite / 3.5]
    end

    A -->|HTTPS REST Queries| REST
    SSE_Client <==|Persistent SSE Stream<br/>/api/realtime/stream| SSE_Bus
    REST --> AuthService
    REST --> JobService
    REST --> AppService
    REST --> AiService

    AppService -->|Broadcast Mutations| SSE_Bus
    AuthService --> DataStore[DataStore Facade]
    JobService --> DataStore
    AppService --> DataStore
    AiService --> DataStore

    DataStore --> H2
    DataStore --> JSON_DB

    AiService -->|Primary LLM Turns| Gemini
    A -.->|Client-Side Direct Low-Latency AI| Gemini
```

---

## 2. Component Architecture Breakdown

### 2.1 Frontend Component Architecture (`frontend/src`)
- **Routing & State:** `App.jsx` handles client-side routing via React Router DOM.
- **Context Providers:**
  - `AuthContext.jsx`: Manages user credentials, active roles (`CANDIDATE`, `RECRUITER`, `ADMIN`), and localStorage tokens.
  - `RealtimeContext.jsx`: Maintains persistent connection to `/api/realtime/stream` using HTML5 `EventSource`, dynamically updating application and notification state across all pages.
- **Service Layer (`services/`):**
  - `aiService.js`: High-level AI coordinator. Routes interview turns and candidate screening requests to direct Gemini client or backend with automatic failover.
  - `geminiClient.js`: Direct client-side SDK for Google Gemini models (`gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`) featuring built-in exponential backoff, JSON extraction, and STAR rubric generation.
  - `jobService.js`, `applicationService.js`: Standard REST abstraction layers over `axiosClient.js`.
- **View Layer (`pages/`):**
  - `AiInterview.jsx`: Turn-by-turn conversational mock interview chamber with isolated container-only scrolling, instant scoring, and live feedback.
  - `Jobs.jsx`, `JobDetails.jsx`: Job browsing and filtering.
  - `PostJob.jsx`: Recruiter vacancy creation with 1-click AI description generator.
  - `Applications.jsx`: Interactive recruitment pipeline tracker.

### 2.2 Backend Architecture (`backend/hiresphere-backend`)
- **Controllers (`com.hiresphere.controller`):**
  - `AiController`: Exposes `/api/ai/screen`, `/api/ai/interview/start`, `/api/ai/interview/message`, and `/api/ai/generate-job`.
  - `JobController`, `ApplicationController`, `UserController`, `InterviewController`.
  - `RealtimeStreamController`: Emits text/event-stream chunks to connected clients.
- **AI Core (`com.hiresphere.ai`):**
  - `GeminiAiService`: Orchestrates prompt construction, HTTP client communication with Google Generative Language APIs, and autonomous local heuristic failover when offline.
- **Persistence Store (`com.hiresphere.store`):**
  - `DataStore`: Thread-safe, disk-persistent in-memory and file store backing all entities without cloud dependency.

---

## 3. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ CANDIDATE_PROFILE : has
    USER ||--o{ JOB : posts
    USER ||--o{ APPLICATION : submits
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ SAVED_JOB : saves
    USER ||--o{ AI_CHAT_MESSAGE : generates

    JOB ||--o{ APPLICATION : receives
    JOB ||--o{ SAVED_JOB : bookmarked_in
    JOB ||--o{ AI_ANALYSIS : evaluated_in

    APPLICATION ||--o{ INTERVIEW : progresses_to

    USER {
        int id PK
        string name
        string email
        string password
        string role
        datetime createdAt
    }

    CANDIDATE_PROFILE {
        int id PK
        int userId FK
        string education
        string experienceYears
        list skills
        string resumeUrl
        string bio
    }

    JOB {
        int id PK
        int recruiterId FK
        string title
        string department
        string location
        string jobType
        string salaryRange
        string description
        list skills
        string status
        datetime createdAt
    }

    APPLICATION {
        int id PK
        int jobId FK
        int candidateId FK
        string status
        string coverNote
        int matchScore
        datetime appliedAt
        datetime updatedAt
    }

    AI_CHAT_MESSAGE {
        string id PK
        string sessionId
        int candidateId FK
        string jobRole
        string sender
        string message
        string feedback
        int score
        datetime timestamp
    }

    AI_ANALYSIS {
        int id PK
        int candidateId FK
        int jobId FK
        int score
        string matchVerdict
        list strengths
        list skillGaps
        string reasoning
        datetime evaluatedAt
    }
```

---

## 4. Key Workflows & Sequence Diagrams

### 4.1 Interactive AI Mock Interview & Coaching Flow
This sequence demonstrates the turn-by-turn conversational mock interview with dynamic topic adaptation (e.g. candidate specifying "OOPs"):

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate (Browser)
    participant UI as AiInterview Component
    participant ClientAI as geminiClient.js
    participant Gemini as Google Gemini 3.1 LLM
    participant Backend as HireSphere Backend
    participant DB as Persistent DBMS

    Candidate->>UI: Selects Job Role & Clicks "Start Interview"
    UI->>Backend: POST /api/ai/interview/start (role, candidateId)
    Backend->>DB: Save session & welcome message
    Backend-->>UI: Return welcome question & coach tip
    UI-->>Candidate: Renders AI Interviewer greeting

    Candidate->>UI: Types "on OOPs" & hits Enter
    Note over UI: Message container scrolls smoothly.<br/>Outer window remains stable.
    UI->>UI: Optimistically append Candidate message
    UI->>ClientAI: geminiInterviewTurn(role, updatedHistory, userMessage)

    alt Direct Gemini Available (Ultra-Low Latency)
        ClientAI->>Gemini: POST generateContent (gemini-3.1-flash-lite)
        Gemini-->>ClientAI: JSON {score, feedback, message}
        ClientAI-->>UI: Return parsed response
        UI->>Backend: Async background sync turn to DB
    else Remote LLM Failure or Offline
        ClientAI-->>UI: Failover to Backend or Local Heuristic Engine
        Note over UI: Heuristic engine generates dynamic,<br/>contextual question without repeating.
    end

    UI->>DB: Persist transcript turn
    UI-->>Candidate: Render AI reply (Polymorphism question) + Coach tip + Real-time score
    Note over UI: Auto-focus restored to input box.
```

---

### 4.2 Autonomous Candidate Screening Workflow (`/api/ai/screen`)
Demonstrates how candidates are evaluated against job requirements autonomously:

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as Recruiter
    participant Web as Recruiter Portal
    participant API as /api/ai/screen Controller
    participant Engine as GeminiAiService
    participant Gemini as Google Gemini API
    participant Store as DataStore
    participant SSE as RealtimeEventService

    Recruiter->>Web: Clicks "Run AI Screening" on Candidate
    Web->>API: POST /api/ai/screen?candidateId=X&jobId=Y
    API->>Engine: screenCandidate(candidateId, jobId)
    Engine->>Store: Fetch CandidateProfile & JobRequirements

    alt Google Gemini Online
        Engine->>Gemini: POST generateContent (evaluation rubric prompt)
        Gemini-->>Engine: Structured JSON (Score, Verdict, Strengths, Gaps)
    else Fallback Engine
        Engine->>Engine: Run autonomous semantic heuristic match
    end

    Engine->>Store: Save AiAnalysis record
    Engine->>SSE: broadcast("AI_ANALYSIS_COMPLETED", payload)
    SSE-->>Web: Push real-time event to connected browsers
    Engine-->>API: Return AiAnalysis
    API-->>Web: Render 0-100% score, strengths, and interview questions
```

---

### 4.3 Real-Time Application Pipeline State Machine
Illustrates how an application moves through hiring stages and notifies candidates instantly:

```mermaid
stateDiagram-v2
    [*] --> APPLIED : Candidate Submits Application
    APPLIED --> REVIEWING : Recruiter Opens Candidate Profile
    REVIEWING --> SHORTLISTED : Recruiter Accepts Resume
    REVIEWING --> REJECTED : Profile Does Not Match Requirements
    
    SHORTLISTED --> INTERVIEW_SCHEDULED : Interview Scheduled via Calendar
    SHORTLISTED --> REJECTED : Candidate Drops or Post-Review Decline
    
    INTERVIEW_SCHEDULED --> ACCEPTED : Successful Technical & Culture Rounds
    INTERVIEW_SCHEDULED --> REJECTED : Candidate Rejected Post-Interview
    
    ACCEPTED --> [*]
    REJECTED --> [*]
```

---

### 4.4 Real-Time Event Synchronization Architecture (SSE Bus)
Demonstrates multi-client synchronization without polling:

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate Window
    actor Recruiter as Recruiter Window
    participant Server as Spring Boot SSE Bus (/api/realtime/stream)
    participant DB as Persistent DBMS

    Candidate->>Server: Connect EventSource (/api/realtime/stream)
    Recruiter->>Server: Connect EventSource (/api/realtime/stream)
    Note over Server: Server registers SseEmitter instances

    Recruiter->>Server: POST /api/applications/{id}/status (SHORTLISTED)
    Server->>DB: Update application status in disk DBMS
    Server->>Server: RealtimeEventService.broadcast("APPLICATION_STATUS_UPDATED")
    
    par Push to Candidate
        Server-->>Candidate: SSE Event: Status changed to SHORTLISTED
        Note over Candidate: UI badge turns Green instantly<br/>without refreshing page!
    and Push to Recruiter
        Server-->>Recruiter: SSE Event: Pipeline count incremented
    end
```

---

## 5. Resilience & Multi-Tier AI Failover Matrix

To ensure the platform operates uninterrupted with a 100% uptime guarantee, HireSphere AI implements a 3-tier cascade:

| Tier | Engine | Protocol | Latency | Capability |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | Client-Side Direct Gemini | HTTPS to Google API (`gemini-3.1-flash-lite`) | ~1.2s - 2.0s | Real-time reasoning, dynamic follow-ups, contextual STAR tips, full topic adaptation. |
| **Tier 2** | Backend Server Gemini | Spring Boot `RestTemplate` to Gemini Endpoint | ~1.5s - 2.5s | Server-authenticated execution with persistent database logging and SSE event broadcast. |
| **Tier 3** | Local Autonomous Engine | In-Memory Heuristic Rule Engine | < 50ms | Topic-aware, progressive non-repeating technical questions and scoring for 100% offline environments. |

---

## 6. Deployment & Physical Topology

```mermaid
graph LR
    subgraph Edge ["Global Edge Tier (Vercel)"]
        Vercel[Vercel CDN<br/>React 19 SPA Build<br/>hire-sphere-ai-front-end.vercel.app]
    end

    subgraph Cloud ["Application Cloud Tier (Render)"]
        Docker[Render Container Linux<br/>Spring Boot Port 8085<br/>hiresphereai.onrender.com]
        Vol[(Persistent Disk Volume<br/>./data/)]
    end

    subgraph Google ["AI Cloud (Google AI Studio)"]
        GeminiCloud[Gemini Generative Language API<br/>REST v1beta]
    end

    Vercel -->|REST API & SSE Stream| Docker
    Vercel -->|Direct Client-Side Turns| GeminiCloud
    Docker -->|Read / Write Transactions| Vol
    Docker -->|Server-Side Generation| GeminiCloud
```
