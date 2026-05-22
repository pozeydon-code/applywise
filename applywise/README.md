# ApplyWise

Intelligent CV, LinkedIn, and cover letter optimization powered by a local AI model.

Upload your PDF CV, paste a job description, and get a compatibility analysis with actionable recommendations — all processed locally, no paid APIs required.

---

## Stack

- **Next.js 16** — App Router, Server Actions, API Routes
- **TypeScript** — strict mode
- **Tailwind CSS 4**
- **Supabase** — Postgres + Row Level Security + Magic Link auth
- **Qwen2.5 7B** via Ollama — local AI inference
- **Vitest** — unit tests
- **Playwright** — E2E tests
- **GitHub Actions** — CI pipeline

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Runtime |
| npm | 10+ | Package manager |
| [Ollama](https://ollama.com) | latest | Local AI server |
| Supabase project | — | Database + Auth |

Pull the model once:

```bash
ollama pull qwen2.5:7b
```

---

## Setup

### 1. Install dependencies

```bash
cd applywise
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the `applywise/` directory:

```env
# Supabase — get these from your project dashboard (Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Ollama — default if running locally
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

> `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the browser. It has the `NEXT_PUBLIC_` prefix intentionally omitted so Next.js keeps it server-only.

### 3. Run database migrations

Open your Supabase project → **SQL Editor** → run each migration in order:

```
supabase/migrations/001_analyses.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_add_user_id.sql
```

This creates the `analyses` table with Row Level Security enabled and per-user access policies.

### 4. Enable Magic Link authentication

In your Supabase dashboard → **Authentication → Providers → Email**, enable **Magic Link** and disable the email confirmation requirement for local development.

Add your local URL to the allowed redirect URLs: `http://localhost:3000/**`

---

## Running the app

Make sure Ollama is running in a separate terminal:

```bash
ollama serve
```

Then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Running tests

```bash
# Unit tests (Vitest)
npm run test:unit

# E2E tests (Playwright) — mocks the AI, no Ollama required
npm run test:e2e

# Both
npm test
```

The E2E suite uses route interception to mock `/api/analyze`, so it runs without a live Ollama instance or Supabase connection.

---

## Project structure

```
src/
├── app/                    # Next.js App Router — UI and API routes
│   ├── _components/        # Shared layout components
│   ├── analyze/            # Results dashboard
│   ├── api/analyze/        # Analysis pipeline (SSE endpoint)
│   ├── api/analyses/       # CRUD for saved analyses
│   ├── auth/callback/      # Supabase Magic Link callback
│   └── login/              # Authentication page
├── features/               # AI prompts per domain
│   ├── cv-analysis/
│   ├── job-matching/
│   └── profile-generation/
├── server/                 # Server-only business logic
│   ├── ai/                 # AiProvider interface + OllamaProvider + MockProvider
│   ├── pdf/                # PDF text extraction
│   ├── persistence/        # Supabase data access layer
│   └── supabase/           # SSR and browser Supabase clients
├── shared/                 # Types, Zod schemas, pure utilities
└── tests/
    ├── unit/
    └── e2e/
```

---

## AI pipeline

The analysis runs as a staged pipeline to keep the 7B model focused:

```
PDF upload
  → extract text (server-side)
  → normalize CV structure (AI)
  → parse job requirements (AI)
  → match evaluation: score + strengths + gaps + keywords (AI)
  → generate assets: summary + LinkedIn + cover letter (AI)
  → save snapshot to Supabase
```

Progress is streamed to the client in real time via Server-Sent Events.

---

## Security

- RLS is enabled on every table. Authenticated users can only read and write their own rows.
- The service-role key is server-only and never sent to the browser.
- All analysis API routes verify the authenticated user before processing.
- Raw CV PDFs are not stored — only the analysis result snapshot is persisted.

---

## CI

GitHub Actions runs on every push to `main`/`develop` and on PRs to `main`:

1. TypeScript type check
2. Vitest unit tests
3. Playwright E2E tests (with `AI_MOCK=true`)

See `.github/workflows/ci.yml`.

---

## Claude Code log

Development was assisted iteratively with Claude Code. See [`docs/claude-code-log.md`](docs/claude-code-log.md) for the full session log including decisions, bugs found, and architectural choices.
