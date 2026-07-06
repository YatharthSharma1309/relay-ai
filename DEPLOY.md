# Relay AI — Production Deployment (Vercel + Neon + Clerk)

## Architecture

```
Browser → Vercel (Next.js) → Neon PostgreSQL
         ↓
       Clerk (auth + orgs)
         ↓
       OpenRouter (chat + optional embeddings)
```

## Prerequisites

- [ ] GitHub repo: `YatharthSharma1309/relay-ai`
- [ ] [Neon](https://neon.tech) PostgreSQL project
- [ ] [Clerk](https://clerk.com) application (production instance)
- [ ] [OpenRouter](https://openrouter.ai) API key

## 1. Neon database

1. Create project → copy **pooled** connection string with `sslmode=require`
2. Set as `DATABASE_URL` in Vercel

## 2. Clerk

1. Create application → copy publishable + secret keys
2. Enable Organizations
3. Configure sign-in/sign-up URLs for your Vercel domain
4. Webhooks → add endpoint `https://YOUR-APP.vercel.app/api/webhooks/clerk`
5. Copy webhook signing secret → `CLERK_WEBHOOK_SECRET`

## 3. Vercel environment variables

Vercel project: **support-ai** (legacy name) — https://vercel.com/yatharthsharma1309s-projects/support-ai  
Production URL: https://support-ai-nine-mu.vercel.app

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Neon pooled URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | |
| `CLERK_SECRET_KEY` | Yes | |
| `CLERK_WEBHOOK_SECRET` | Yes | |
| `OPENROUTER_API_KEY` | Yes | |
| `APP_URL` | Yes | `https://YOUR-APP.vercel.app` |
| `OPENROUTER_CHAT_MODEL` | No | Default `openrouter/free` |
| `DEMO_SEED_SECRET` | Yes (prod) | Random string for `POST /api/demo/seed` |
| `AUTH_BYPASS` | **Never in prod** | |

Optional: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for distributed rate limits.

## 4. Build settings

Vercel auto-detects Next.js. Recommended build command:

```
npm run db:migrate:deploy && npm run build
```

Or run migrations post-deploy from local:

```bash
DATABASE_URL="..." npm run db:migrate:deploy
```

## 5. Post-deploy seed

```bash
# Sign in to dashboard first, or use demo seed API:
curl -X POST https://YOUR-APP.vercel.app/api/demo/seed \
  -H "Authorization: Bearer YOUR_DEMO_SEED_SECRET"
```

Then upload 2–3 FAQ documents via Knowledge Base UI. Demo seed also creates a sample recruitment job at `/recruitment`.

## 6. Widget demo

1. Sign in → Settings → Widget → copy embed snippet
2. Test on a static HTML page or portfolio site

## 7. Portfolio link

```
NEXT_PUBLIC_DEMO_RELAY_AI_URL=https://YOUR-APP.vercel.app
```

## Portfolio showcase (clients & interviewers)

**Live demo:** https://support-ai-nine-mu.vercel.app

Recommended walkthrough (no sign-in required when `PUBLIC_DEMO_MODE` is enabled):

1. **Landing** → click **Open live demo**
2. **Dashboard** — setup health, stats, recent tickets
3. **AI Chatbot** (`/chat`) — ask *"What is the refund policy?"* and show citations
4. **Recruitment** (`/recruitment`) — open demo job → candidate → **Run analysis**
5. **Analytics** (`/analytics`) — deflection rate and knowledge gaps
6. **Help center** (`/help/demo-company`) — public KB + embedded widget
7. **Widget** (`/widget`) — embed preview for customer sites

### Portfolio env (Vercel production)

```bash
node scripts/push-vercel-env.mjs   # sync demo env from local .env
npx vercel --prod --yes
curl -X POST https://support-ai-nine-mu.vercel.app/api/demo/seed \
  -H "Authorization: Bearer YOUR_DEMO_SEED_SECRET"
```

| Variable | Portfolio demo |
|----------|----------------|
| `PUBLIC_DEMO_MODE` | `true` |
| `NEXT_PUBLIC_PUBLIC_DEMO_MODE` | `true` |
| `AUTH_BYPASS` | `true` (demo only) |
| `NEXT_PUBLIC_AUTH_BYPASS` | `true` |
| `DEMO_WIDGET_KEY` | stable key for embed/tests |
| `APP_URL` | your Vercel URL |

For a **private production** app, remove demo bypass vars and configure Clerk keys instead.

## Smoke test

- [ ] `GET /api/health` returns OK
- [ ] Sign up + create org
- [ ] Upload document
- [ ] Chat with citation
- [ ] `/recruitment` — view demo job + candidate pipeline
- [ ] Widget stream (optional)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Clerk redirect loop | Set correct URLs in Clerk dashboard |
| DB connection error | Use Neon pooled URL with SSL |
| Chat empty | Verify `OPENROUTER_API_KEY` |
| Webhook 401 | Check `CLERK_WEBHOOK_SECRET` |

## Security

- Never set `AUTH_BYPASS` or `E2E_AUTH_BYPASS` in production
- Set OpenRouter spend limits
