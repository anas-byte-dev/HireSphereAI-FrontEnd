# Software Requirements Specification (SRS)
## Project Name: HireSphere AI &mdash; Autonomous Real-Time Talent & Placement Platform
**Document Version:** 1.0.0  
**Standard Compliance:** IEEE Std 830-1998 / ISO/IEC/IEEE 29148  
**Date:** September 2026  
**Status:** Approved / Production  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the functional, non-functional, interface, and operational requirements for **HireSphere AI**, an autonomous, real-time talent recruitment, placement, and mock interview coaching platform. It provides a formal contract between stakeholders, developers, software architects, and quality assurance engineers.

### 1.2 Scope
HireSphere AI is an intelligent recruitment ecosystem designed for modern enterprises, recruitment agencies, universities, and job candidates. The platform automates candidate screening, job description authoring, and interview preparation using Google Gemini Large Language Models (LLM) and autonomous agentic fallback logic, backed by persistent real-time database synchronisation via Server-Sent Events (SSE).

**Core Capabilities:**
- **Candidate Portal:** Job discovery, multi-criteria filtering, 1-click application submission, real-time pipeline status tracking, and turn-by-turn interactive AI mock interview coaching.
- **Recruiter Portal:** AI-assisted job description drafting, candidate ranking and automated resume screening, pipeline status advancement, and interview scheduling.
- **Admin Portal:** System diagnostics, platform-wide analytics, user moderation, and audit logs.
- **Agentic AI Engine:** 3-agent autonomous architecture (Screening Agent, Interview Coaching Agent, Job Rubric Drafter).
- **Persistent Real-Time Sync:** Event-driven architecture updating application states across multiple clients without page refresh.

### 1.3 Definitions, Acronyms, and Abbreviations
| Term | Definition |
| :--- | :--- |
| **SRS** | Software Requirements Specification |
| **LLM** | Large Language Model (e.g., Google Gemini 3.1 Flash Lite) |
| **SSE** | Server-Sent Events (unidirectional real-time protocol over HTTP) |
| **RBAC** | Role-Based Access Control |
| **STAR** | Situation, Task, Action, Result (Behavioral interview evaluation methodology) |
| **DBMS** | Database Management System |
| **SPA** | Single Page Application (React 19 + Vite 8) |
| **REST** | Representational State Transfer |
| **JWT** | JSON Web Token |

---

## 2. Overall Description

### 2.1 Product Perspective
HireSphere AI operates as a cloud-deployed, distributed software suite with a decoupled Single Page Application (SPA) frontend and a modular Spring Boot microservice backend. It interacts with Google Gemini APIs for generative AI capabilities and embedded disk-persistent DBMS storage for data integrity.

```
+-------------------------------------------------------------+
|                      Client Browser                         |
|      (React 19, Vite, Context API, Axios, EventSource)      |
+------------------------------+------------------------------+
                               | HTTPS / SSE
                               v
+-------------------------------------------------------------+
|                  HireSphere API Gateway                     |
|            Spring Boot 3.2.5 (Java 17, Port 8085)           |
+---------------+-----------------------------+---------------+
                |                             |
                v                             v
+-------------------------------+ +---------------------------+
|    Persistent DBMS Storage    | |     Google Gemini LLM     |
| (H2 Disk File / JSON Engine)  | | (Gemini 3.1/3.5 REST API) |
+-------------------------------+ +---------------------------+
```

### 2.2 User Classes and Characteristics
1. **Candidate:**
   - Technical background varying from entry-level to principal engineer.
   - Goals: Find relevant vacancies, track recruitment status transparently, practice realistic technical interviews, and receive actionable coaching tips.
2. **Recruiter / Hiring Manager:**
   - Non-technical or technical HR personnel.
   - Goals: Draft job listings rapidly, screen high volumes of applicants automatically, identify skill gaps, and schedule interviews efficiently.
3. **Administrator:**
   - Platform managers and operations engineers.
   - Goals: Monitor system health, oversee data stores, audit transactions, and manage user roles.

### 2.3 Operating Environment
- **Client Side:** Any modern web browser supporting ECMAScript 2022+ and HTML5 Server-Sent Events (Google Chrome 110+, Mozilla Firefox 110+, Safari 16+, Microsoft Edge 110+).
- **Frontend Hosting:** Vercel Global Edge Network (`https://hire-sphere-ai-front-end.vercel.app`).
- **Backend Runtime:** Java Virtual Machine (OpenJDK 17 LTS), Spring Boot 3.2.5 on Render Linux Container (`https://hiresphereai.onrender.com`).
- **Storage Subsystem:** Local persistent file-based disk storage (`./data/hiresphere_realtime_db.mv.db` and `./data/hiresphere_realtime_db.json`) with ACID compliance.

### 2.4 Design and Implementation Constraints
- **Zero-Cost Operation:** The platform must execute without requiring paid third-party infrastructure; Gemini Free Tier and embedded autonomous fallback agents ensure uninterrupted functionality.
- **Browser Scroll Stability:** Chat and conversational interfaces must never trigger window-level jumping or auto-scrolling that displaces headers or input elements.
- **Failover Guarantee:** AI interview coaching and screening must never leave the user hanging; if remote Gemini API experiences rate spikes (HTTP 503) or outages, the internal autonomous engine responds within 100 milliseconds.

---

## 3. Specific Functional Requirements

### 3.1 User Management & Authentication (FR-AUTH)
- **FR-AUTH-01 (Registration):** The system shall allow users to register with name, email, password, and assigned role (`CANDIDATE`, `RECRUITER`, `ADMIN`).
- **FR-AUTH-02 (Authentication):** The system shall authenticate credentials, returning a secure session token and user profile object.
- **FR-AUTH-03 (Role-Based Access Control):** 
  - Candidates can access `/jobs`, `/applications/my`, and `/ai-interview`.
  - Recruiters can access `/jobs/new`, `/applications/job/{id}`, `/analytics`, and `/ai/screen`.
  - Administrators can access all endpoints and system diagnostics (`/health`, `/swagger-ui.html`, `/h2-console`).
- **FR-AUTH-04 (Demo Seed Accounts):** The system shall pre-seed functional demo accounts for testing (`candidate123`, `recruiter123`, `admin123`).

### 3.2 Job Vacancy Management (FR-JOB)
- **FR-JOB-01 (Job Creation):** Recruiters shall be able to create job postings with title, department, location, job type (Full-Time, Remote, Hybrid), salary range, and required skills.
- **FR-JOB-02 (AI Job Description Generation):** Recruiters shall be able to generate full descriptions, requirements lists, and salary benchmarks via Gemini AI using title and skills keywords.
- **FR-JOB-03 (Discovery & Filtering):** Candidates shall be able to search jobs by keyword, filter by work mode, location, and required technical skills.
- **FR-JOB-04 (Saved Jobs):** Candidates shall be able to bookmark and unbookmark jobs to/from their personal saved list.

### 3.3 Application Pipeline & Lifecycle (FR-APP)
- **FR-APP-01 (Application Submission):** Authenticated candidates shall be able to apply to open vacancies with uploaded or profile-backed resumes and cover notes.
- **FR-APP-02 (Duplicate Application Prevention):** The system shall enforce uniqueness: a candidate cannot apply to the same job posting more than once.
- **FR-APP-03 (Pipeline State Machine):** Applications shall progress through deterministic stages:
  $$\text{APPLIED} \longrightarrow \text{REVIEWING} \longrightarrow \text{SHORTLISTED} \longrightarrow \text{INTERVIEW\_SCHEDULED} \longrightarrow \begin{cases} \text{ACCEPTED} \\ \text{REJECTED} \end{cases}$$
- **FR-APP-04 (Status Update):** Recruiters shall have permission to update candidate pipeline stages, triggering immediate real-time notifications to the candidate.

### 3.4 Autonomous Agentic AI System (FR-AI)
- **FR-AI-01 (Candidate Screening Agent):**
  - Compares candidate skills, projects, and education against job requirements.
  - Outputs match score (0–100%), match verdict (`EXCELLENT_FIT`, `GOOD_FIT`, `MODERATE_FIT`, `POOR_FIT`), identified strengths, skill gaps, reasoning narrative, and suggested interview questions.
- **FR-AI-02 (Interactive Mock Interviewer & Coach):**
  - Simulates dynamic, conversational technical mock interviews for any selected or custom job title.
  - Generates turn-by-turn evaluations based on STAR methodology.
  - Dynamically adapts when candidate clarifies a concept (e.g. OOPs, databases, multithreading), explaining the concept briefly and posing practical architectural challenges.
  - Provides constructive coaching tips and running session scores (0–100).
- **FR-AI-03 (Conversation History Continuity):** The interview agent shall maintain multi-turn memory of previous exchanges to avoid repetition and deepen inquiry.
- **FR-AI-04 (Autonomous Fallback Engine):** If network or API quota limits occur, the internal heuristic engine shall provide context-aware, non-repeating questions and rubric evaluations instantly.

### 3.5 Real-Time Event Synchronization (FR-REALTIME)
- **FR-REALTIME-01 (Event Broadcasting):** The backend shall emit Server-Sent Events (SSE) upon any data mutation (`APPLICATION_CREATED`, `STATUS_UPDATED`, `INTERVIEW_SCHEDULED`, `AI_MESSAGE_RECEIVED`).
- **FR-REALTIME-02 (Client Subscription):** Frontend instances shall maintain an active EventSource stream and automatically update UI state without page reloads.
- **FR-REALTIME-03 (Auto-Reconnect):** If the SSE connection drops, the frontend client shall automatically attempt reconnection with exponential backoff.

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- Modern, clean, responsive UI with unified design tokens (inter font family, dark/light cards, accessible contrast, accessible buttons).
- Dynamic layout adjusting seamlessly across desktop (1920x1080, 1440x900) and mobile viewports.
- Chat UI strictly isolates vertical scrolling to the message container; outer page layout remains fixed during message entry and response streaming.

### 4.2 Software Interfaces
- **Google Gemini API (v1beta):** REST endpoints over HTTPS using model `gemini-3.1-flash-lite` (with fallback to `gemini-3.5-flash-lite` and `gemini-flash-lite-latest`).
- **Embedded Database:** H2 Engine in file mode (`jdbc:h2:file:./data/hiresphere_realtime_db`).
- **Springdoc Swagger UI:** OpenAPI 3.0 documentation available at `/swagger-ui.html`.

### 4.3 Communication Interfaces
- RESTful HTTP/HTTPS communication using JSON payloads (`application/json`).
- Event streaming over text-based event stream (`text/event-stream;charset=UTF-8`).
- Cross-Origin Resource Sharing (CORS) configured for authorized production domains and local development ports (`5175`, `8085`).

---

## 5. Non-Functional Requirements (NFR)

### 5.1 Performance
- **NFR-PERF-01 (API Latency):** Core CRUD endpoints shall respond in $< 150 \text{ ms}$ under nominal load.
- **NFR-PERF-02 (AI Turnaround):** Direct Gemini 3.1 Flash Lite responses shall stream or complete in $< 2.5 \text{ seconds}$.
- **NFR-PERF-03 (Fallback Speed):** Local autonomous fallback engine shall respond in $< 80 \text{ ms}$.

### 5.2 Reliability & Availability
- **NFR-REL-01 (Data Durability):** 100% of user profiles, jobs, applications, and chat transcripts shall persist to disk immediately upon mutation.
- **NFR-REL-02 (Fault Tolerance):** Failure of the third-party Gemini API shall not cause platform crashes or blank interview states; the autonomous fallback engine guarantees continuous user interaction.

### 5.3 Security & Privacy
- **NFR-SEC-01 (Secrets Isolation):** API keys and credentials shall never be checked into public version control; production configurations rely on environment variables (`GEMINI_API_KEY`, `VITE_GEMINI_API_KEY`).
- **NFR-SEC-02 (Input Sanitization):** All chat messages, job descriptions, and user inputs are trimmed and sanitized against Cross-Site Scripting (XSS) and injection vectors.
- **NFR-SEC-03 (RBAC Enforcement):** Unauthorized access to recruiter or administrative endpoints returns HTTP 401 Unauthorized or 403 Forbidden.

---

## 6. Verification & Acceptance Criteria

| Req ID | Requirement | Verification Method | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **VR-01** | Candidate applies to job | Integration Test / E2E | Application record created in DB, stage set to `APPLIED`, recruiter sees real-time notification. |
| **VR-02** | AI Interview Turn | Manual & Automated E2E | Candidate sends "on OOPs"; AI responds with polymorphic architectural question, coach tip, and score; page does NOT jump down. |
| **VR-03** | Server Restart Durability | System Test | Add candidate, restart Spring Boot backend; candidate record exists and is queryable in `/api/users`. |
| **VR-04** | Real-Time SSE Sync | Dual-Browser Test | Window 1 (Recruiter) updates status; Window 2 (Candidate) sees badge update instantly without reload. |
