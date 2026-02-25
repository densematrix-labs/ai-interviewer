# AI Interviewer — Automated Screening Interview Agent

## Product Overview

| Item | Value |
|------|-------|
| Product Name | AI Interviewer |
| Target Users | HR professionals, recruiters, hiring managers |
| Core Value | Automate initial candidate screening with AI-powered text interviews |
| Deployment URL | https://ai-interviewer.demo.densematrix.ai |

## Core Features (MVP)

### 1. Create Interview Session (HR)
- Input job title, requirements, and key skills
- AI generates 5-10 relevant screening questions
- Get unique shareable link for candidates

### 2. Candidate Interview (Candidate)
- Access interview via unique link
- Answer questions in text format
- Submit responses when complete

### 3. AI Evaluation
- AI scores each answer (1-5)
- Generates overall assessment
- Provides recommendation: ✅ Recommend / ⚠️ Maybe / ❌ Not Recommended

### 4. Results Dashboard (HR)
- View all candidates for an interview
- See scores, rankings, and AI comments
- Quick filtering by recommendation status

## Technical Architecture

### Frontend (React + Vite + TypeScript)
- `/` - Landing page
- `/create` - HR creates new interview
- `/interview/:id` - Candidate answers questions
- `/results/:id` - HR views results dashboard
- `/pricing` - Payment plans

### Backend (Python FastAPI)
- `POST /api/v1/interviews` - Create interview session
- `GET /api/v1/interviews/:id` - Get interview details
- `POST /api/v1/interviews/:id/submit` - Submit candidate answers
- `GET /api/v1/interviews/:id/results` - Get all results (HR only)
- `POST /api/v1/payment/checkout` - Payment integration
- `POST /api/v1/payment/webhook` - Creem webhook

### Data Models

**Interview Session**
```
id: UUID
job_title: string
job_requirements: string
key_skills: string[]
questions: Question[]
created_at: datetime
hr_access_code: string (for results access)
```

**Question**
```
id: int
text: string
expected_focus: string (hint for evaluation)
```

**Candidate Submission**
```
id: UUID
interview_id: UUID
candidate_name: string
candidate_email: string
answers: Answer[]
scores: Score[]
overall_score: float
recommendation: enum (recommend/maybe/not_recommended)
ai_summary: string
submitted_at: datetime
```

## AI Integration

Uses LLM Proxy (llm-proxy.densematrix.ai) for:
1. **Question Generation**: Given job requirements, generate relevant screening questions
2. **Answer Evaluation**: Score answers based on relevance, depth, and alignment with job requirements
3. **Overall Assessment**: Generate summary and recommendation

## Pricing Tiers

| Tier | Price | Interviews | Value |
|------|-------|------------|-------|
| Free | $0 | 1 interview (5 candidates max) | Try before buy |
| Starter | $4.99 | 10 interviews | Small teams |
| Pro | $9.99 | 50 interviews | Growing companies |
| Unlimited | $19.99/mo | Unlimited | High-volume hiring |

## Differentiation

- ✅ No video required - simple text interview
- ✅ Instant AI evaluation
- ✅ Much cheaper than HireVue, Spark Hire, etc.
- ✅ No login required for candidates
- ✅ Immediate results for HR

## Tech Stack

- Frontend: React 18 + Vite + TypeScript + Tailwind CSS
- Backend: Python 3.12 + FastAPI + SQLite
- AI: LLM Proxy (Claude/GPT)
- Deployment: Docker → langsheng (30200/30201)
