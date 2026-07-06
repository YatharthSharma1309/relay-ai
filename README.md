# OpsAI — AI Operations Platform

**Portfolio flagship** — unified multi-tenant SaaS combining **customer support** and **recruitment** in one workspace:

| Module | Capabilities |
|--------|----------------|
| **Support** | Knowledge base, streaming RAG chat with citations, agent inbox, tickets, embeddable widget, deflection analytics |
| **Recruitment** | Job posts, PDF/DOCX resume parsing, AI match scoring, skill gaps, interview questions, hiring pipeline with hire-safety grace window |

Built with **Next.js 16**, **React 19**, **TypeScript**, **Prisma + PostgreSQL**, **Clerk** (multi-tenant orgs), and **OpenRouter**.

> RecruitAI was merged into this codebase (2026-07-06). One repo, one deploy, org-scoped data for both modules.

## Quick start

```bash
npm install
cp .env.example .env
# Set DATABASE_URL, OPENROUTER_API_KEY; optional Clerk keys or AUTH_BYPASS=true for local demo
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → `/dashboard` (support) or `/recruitment` (hiring).

## Modules

### Customer support (`/dashboard`, `/knowledge`, `/chat`, `/inbox`, `/tickets`)

- Upload PDF, DOCX, TXT, Markdown → chunked RAG index
- Streaming admin + widget chat with source citations
- Ticket escalation, agent copilot, analytics
- Public help center + embeddable widget

### Recruitment (`/recruitment`)

- Create jobs with required/preferred skills and experience criteria
- Upload resumes (PDF/DOCX) or paste text manually
- AI analysis: match score, skill gaps, interview questions
- Pipeline: new → shortlisted → interviewing → hired/rejected
- Hire safety: grace window to undo before archiving other candidates

## Tech stack

- Next.js 16 App Router, Tailwind CSS 4
- Prisma + PostgreSQL (Neon-ready)
- Clerk organizations + role-based access
- OpenRouter for chat, analysis, and job-assist
- Vitest + Playwright

## API routes (recruitment)

| Route | Description |
|-------|-------------|
| `GET/POST /api/recruitment/jobs` | List / create jobs |
| `GET/PATCH/DELETE /api/recruitment/jobs/[id]` | Job CRUD |
| `POST /api/recruitment/jobs/assist` | AI job description assist |
| `POST /api/recruitment/upload` | Resume upload |
| `POST /api/recruitment/analyze` | Run candidate analysis |
| `GET/PATCH/DELETE /api/recruitment/candidates/[id]` | Candidate detail / update |

Support APIs remain under `/api/documents`, `/api/chat`, `/api/tickets`, etc.

## Deploy

See [DEPLOY.md](./DEPLOY.md) for Vercel + Neon + Clerk production setup.

Live demo: https://support-ai-nine-mu.vercel.app

## Scripts

```bash
npm run dev          # Development
npm run build        # Production build
npm run db:migrate   # Apply migrations (includes recruitment models)
npm run db:seed      # Demo support KB + tickets + sample recruitment job
npm run test         # Unit tests
npm run test:e2e     # Playwright
```
