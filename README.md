# SupportAI — AI Customer Support Platform

**Portfolio flagship** — multi-tenant SaaS for AI-powered customer support: upload docs, stream grounded answers, escalate to tickets, embed a widget on customer sites, and measure deflection from one dashboard.

> **Note (2026-07-06):** This is the sole live portfolio SaaS demo. The separate RecruitAI project was retired and consolidated at the portfolio level (repo archived, Vercel removed). See [Career-OS consolidation notes](https://github.com/YatharthSharma1309/career-os/blob/master/CONSOLIDATION.md).

## Features

- **Knowledge Base** — Upload PDF, DOCX, TXT, and Markdown. Text is extracted at upload, chunked, and indexed (serverless-safe).
- **AI Chatbot** — Streaming RAG with source citations, thumbs feedback, and conversation history.
- **Agent Inbox** — Monitor customer conversations, escalations, and linked tickets.
- **Embeddable Widget** — Publishable widget key + anonymous visitor sessions for end-users.
- **Ticket copilot** — Suggest reply drafts from transcript + knowledge base.
- **Analytics** — Deflection rate, helpful rate, resolution time, channel breakdown, knowledge gaps.
- **Help Center** — Public docs search per organization slug with “Ask AI” handoff.
- **Multi-tenant auth** — Clerk organizations for admins/agents; widget key for public visitors.

## Tech Stack

- Next.js 16 (App Router) + React + TypeScript
- Tailwind CSS 4
- Prisma + PostgreSQL (Neon-ready)
- Clerk (admin auth + orgs)
- OpenRouter (chat + optional embeddings)
- Recharts

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Required:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string ([Neon](https://neon.tech) pooled URL in production) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From [Clerk](https://clerk.com) dashboard |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret |
| `OPENROUTER_API_KEY` | From [OpenRouter](https://openrouter.ai/keys) — required for AI chat streaming |
| `APP_URL` | e.g. `http://localhost:3000` |

Optional:

| Variable | Description |
|----------|-------------|
| `OPENROUTER_CHAT_MODEL` | Default `openrouter/free` |
| `OPENROUTER_EMBEDDING_MODEL` | Leave empty for keyword search |
| `OPENAI_API_KEY` | Fallback if not using OpenRouter |
| `AI_CHAT_MODEL` | Alias for `OPENROUTER_CHAT_MODEL` |
| `AUTH_BYPASS` | **Local dev only**; skips Clerk and uses demo org (never in production) |
| `NEXT_PUBLIC_AUTH_BYPASS` | Client-side mirror of `AUTH_BYPASS` for dashboard UI hints |
| `E2E_AUTH_BYPASS` | **CI/E2E only**; allows bypass in production builds during Playwright (set with `AUTH_BYPASS`) |
| `DEMO_WIDGET_KEY` | Fixed widget key for local/CI e2e tests |
| `PLAYWRIGHT_DASHBOARD` | Set to `1` to run dashboard Playwright tests |
| `DEMO_SEED_SECRET` | Required in production to call `POST /api/demo/seed` |
| `WIDGET_VISITOR_SECRET` | Signs widget visitor sessions (recommended in production) |
| `UPSTASH_REDIS_REST_URL` | Optional Upstash Redis URL for distributed rate limits |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token (pairs with URL above) |

Previously listed as optional (still supported):

- `DEMO_ORGANIZATION_SLUG`, `DEMO_USER_EMAIL` — demo workspace defaults when using auth bypass

### 3. Clerk setup

1. Create a Clerk application and enable **Organizations**.
2. Set sign-in/sign-up URLs to `/sign-in` and `/sign-up`.
3. Add webhook endpoint `https://your-domain/api/webhooks/clerk` (use ngrok locally).
4. Subscribe to: `user.*`, `organization.created`, `organizationMembership.*`.

### 4. Set up the database

Start a local Postgres instance (choose one):

```bash
# Prisma Dev — spins up a local Postgres and prints a postgres:// URL for DATABASE_URL
npx prisma dev
```

Or use your own Postgres and set `DATABASE_URL` in `.env`.

Apply migrations:

```bash
npm run db:migrate
```

`db:migrate` runs `prisma migrate dev` (creates/applies migrations and regenerates the client). For quick schema sync without migration history:

```bash
npm run db:push
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Without Clerk (local only):** set `AUTH_BYPASS=true` and `NEXT_PUBLIC_AUTH_BYPASS=true` in `.env`, then open `/dashboard` directly.

**With Clerk:** sign up, create or join an organization, then use the dashboard.

## Deploy checklist (Vercel + Neon)

1. Create Neon project; use the **pooled** connection string with `sslmode=require`.
2. Set all env vars in Vercel (never set `AUTH_BYPASS` in production).
3. Run `npm run db:migrate:deploy` after deploy (or add to your Vercel build command).
4. Configure Clerk production instance + webhook URL.
5. Set OpenRouter spend limits in the OpenRouter dashboard.
6. Copy widget embed snippet from **Settings → Widget** after first org login.

## Route access

| Surface | Auth |
|---------|------|
| `/`, `/sign-in`, `/sign-up` | Public |
| `/onboarding` | Clerk session (org selection) |
| `/help`, `/help/[slug]` | Public (org slug) |
| `/widget/embed?key=` | Widget key |
| `/dashboard`, `/inbox`, `/inbox/[id]`, `/tickets`, `/knowledge`, `/analytics`, `/chat` | Clerk session + org membership |
| `/settings`, `/widget` (preview) | Clerk session; settings require **ADMIN** role |
| `/api/documents*`, `/api/settings`, `/api/conversations*`, `/api/tickets*`, `/api/chat*` | Session |
| `/api/widget/*` | Widget key + signed `visitorToken` |
| `/api/health` | Public readiness probe (DB ping) |
| `/api/webhooks/clerk` | Clerk signature |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/documents` | GET | List documents |
| `/api/documents/upload` | POST | Upload and index (ADMIN) |
| `/api/documents/:id` | DELETE | Delete document (ADMIN) |
| `/api/chat` | POST | Admin non-streaming RAG chat |
| `/api/chat/stream` | POST | Admin streaming RAG chat (SSE) |
| `/api/messages/:id/feedback` | POST | Thumbs up/down on admin chat messages |
| `/api/conversations` | GET | List conversations |
| `/api/conversations/:id` | GET | Conversation detail with messages |
| `/api/tickets` | GET, POST | List or create tickets |
| `/api/tickets/:id` | GET, PATCH | Ticket detail or status update |
| `/api/tickets/:id/comments` | POST | Add agent comment to ticket |
| `/api/tickets/:id/suggest-reply` | POST | AI-suggested reply draft (ADMIN) |
| `/api/settings` | GET, PATCH | AI agent settings (ADMIN) |
| `/api/settings/widget` | GET, PATCH, POST | Widget key and embed settings (ADMIN) |
| `/api/widget/session` | POST | Issue signed visitor session (`visitorId` + `visitorToken`) |
| `/api/widget/chat/stream` | POST | Widget streaming chat (SSE) |
| `/api/widget/tickets` | POST | Create ticket from widget escalation |
| `/api/widget/messages/:id/feedback` | POST | Thumbs feedback on widget messages |
| `/api/demo/seed` | POST | Seed demo workspace (dev or `DEMO_SEED_SECRET`) |
| `/api/webhooks/clerk` | POST | Clerk user/org sync webhook |

Rate limits (Upstash Redis when configured; otherwise in-memory per instance):

- Admin chat stream: 60/min per org
- Widget chat: 30/min per IP, 200/min per org
- Widget tickets: 10/hour per IP, 50/hour per org
- Widget feedback: 60/min per IP
- Document upload: 10/hour per org
- Suggest reply: 20/hour per org

## Testing

```bash
npm run test        # unit tests (Vitest)
npm run test:e2e    # Playwright smoke + widget API tests
```

CI runs typecheck, lint, Prisma schema validation, unit tests, and build on every push/PR (`.github/workflows/ci.yml`). E2E runs on pull requests and manual `workflow_dispatch` only (`.github/workflows/e2e.yml`) — migrations, demo seed, production build, and Playwright against `next start`. E2E sets `E2E_AUTH_BYPASS=true` so auth bypass works in the production build — do not use that flag outside CI.

Production deployment: see [DEPLOY.md](./DEPLOY.md).

For dashboard flows locally, run a dev server with `AUTH_BYPASS=true` and `NEXT_PUBLIC_AUTH_BYPASS=true`, then:

```bash
DEMO_WIDGET_KEY=wk_test_e2e_demo_widget_key npm run db:seed
PLAYWRIGHT_DASHBOARD=1 DEMO_WIDGET_KEY=wk_test_e2e_demo_widget_key npm run test:e2e
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/   # Protected dashboard routes
│   ├── help/          # Public help center by org slug
│   ├── widget/        # Widget preview + embed route
│   └── api/           # Admin, widget, and webhook APIs
├── components/
├── lib/
│   ├── auth/          # Clerk session, widget auth, demo bypass
│   ├── rag/           # Chunking, embeddings, retrieval
│   └── chat/          # Chat service + stream handler
└── generated/prisma/
```

## Document storage note

Uploads are processed in memory at ingest time. Chunk text lives in PostgreSQL; original files are not persisted on disk. Re-upload a document to re-index. For durable file retention, add Vercel Blob or R2 (future).
