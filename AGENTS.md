# AGENTS.md

## Project Context

This project is an AI course project called **ApplyWise**.

ApplyWise is a web app that helps users optimize their CV, LinkedIn profile, and cover letter for a specific job offer. The core differentiator is that it uses a **local AI model** instead of depending on paid external APIs.

This project must be built and presented to satisfy the evaluation rubric in `rubrica_evaluacion.pdf`:

- Core functionality works end-to-end without visible errors.
- Claude Code is used as a real copilot with iterative prompting and context.
- Architecture is modular and readable, with business logic outside UI components.
- Backend/data layer uses Supabase with RLS, protected endpoints, and no exposed secrets.
- Testing includes at least one Vitest unit test and one Playwright E2E test running in CI.
- Final demo explains problem, stack, and AI role in under 5 minutes.

## Product Goal

Build a functional MVP where a user can:

1. Upload a CV as a PDF.
2. Paste a job description.
3. Extract text from the PDF server-side.
4. Analyze the CV and job description using local AI.
5. Receive:
   - Compatibility score.
   - Strengths.
   - Weaknesses / gaps.
   - Missing keywords.
   - Concrete improvement recommendations.
   - Optimized professional summary.
   - LinkedIn headline and about section.
   - Cover letter adapted to the job.
6. Save minimal analysis metadata/results through Supabase so the project has a real backend/data layer for the rubric.

## Evaluation-Driven Definition of Done

The MVP is complete only when all rubric-critical items are covered:

### 1. Funcionalidad core — 3 pts

- The main flow runs end-to-end: upload PDF → paste job offer → analyze → render dashboard.
- PDF extraction errors are handled with user-friendly messages.
- Local AI unavailability is handled with a clear error message.
- No manual workaround should be required during the demo.

### 2. Uso de Claude Code — 3 pts

- Development should show meaningful Claude Code usage: planning, iterative prompts, refactors, tests, and debugging.
- Keep a small `docs/claude-code-log.md` or equivalent notes file with relevant prompts/iterations and decisions.
- Every agent or Claude Code session that changes planning, code, tests, architecture, debugging, or demo preparation must append a short entry to `docs/claude-code-log.md`.
- Be ready to explain during the demo which parts Claude Code helped generate and how context was used.

### Mandatory Claude Code Log Rule

Maintain `docs/claude-code-log.md` throughout the project. This file is evaluation evidence for the “Uso de Claude Code” rubric criterion.

After any meaningful AI-assisted work, append an entry with:

- Date/session.
- Prompt or task summary.
- What Claude/agent helped with.
- Files or areas changed.
- Decision made or issue solved.
- Next step.

Do not wait until the end of the project to fill this file retroactively. The log should show an iterative workflow with context, planning, implementation, refactors, testing, and debugging.

### 3. Arquitectura y código — 2 pts

- Use clear folder structure and separation of responsibilities.
- Keep business logic, AI orchestration, PDF parsing, persistence, validation, and UI separated.
- Do not put analysis logic directly inside React components.
- Prefer typed domain models and schemas for AI outputs.

### 4. Backend y datos — 2 pts

- Use Supabase for the backend/data requirement.
- Configure Row Level Security (RLS) on all tables.
- Protect endpoints/server actions so secrets never reach the browser.
- Store only user-consented, minimal data. For MVP, prefer storing analysis metadata and generated result snapshots, not raw CV PDFs.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, local AI URLs containing secrets, or private environment variables client-side.

### 5. Testing — 2 pts

- Add at least one unit test with Vitest.
- Add at least one E2E test with Playwright.
- Configure CI so both tests run automatically.

### 6. Demo y claridad — 3 pts

- Prepare a live demo flow under 5 minutes.
- Explain clearly:
  - The user problem.
  - The stack.
  - The role of local AI.
  - The multi-step AI pipeline.
  - The ethical rule: the app does not invent professional experience.

## AI Model

The project should use a local model:

- **Qwen2.5 7B**

Assume it may be exposed through one of these local runtimes:

- Ollama, usually at `http://localhost:11434`.
- LM Studio or another OpenAI-compatible local server.

Do not hardcode a single provider too deeply. Create an AI provider abstraction so the runtime can be swapped later.

## Important AI Constraints

Qwen2.5 7B is capable but limited compared with larger hosted models. Do not send one huge prompt that tries to do everything at once.

Prefer a pipeline:

1. Extract text from PDF.
2. Normalize the CV into structured data.
3. Analyze the job offer into structured data.
4. Compare CV vs job offer.
5. Generate recommendations.
6. Generate LinkedIn/CV/cover-letter assets.

The AI must not invent experience, companies, degrees, years, skills, achievements, or metrics. It may only rephrase, emphasize, organize, and recommend based on user-provided information. If information is missing, the app should recommend that the user adds it manually.

## Suggested Architecture

Recommended stack:

- Next.js web app.
- TypeScript.
- Tailwind CSS.
- shadcn/ui if useful.
- Server-side PDF parsing.
- Local AI provider integration.
- Supabase for backend/data and RLS.
- Vitest for unit testing.
- Playwright for E2E testing.
- GitHub Actions or equivalent CI for test execution.

Suggested structure:

```txt
src/
├── app/
│   ├── page.tsx
│   ├── analyze/
│   └── api/
├── features/
│   ├── cv-analysis/
│   ├── job-matching/
│   └── profile-generation/
├── server/
│   ├── ai/
│   ├── pdf/
│   ├── persistence/
│   └── auth/
├── shared/
│   ├── schemas/
│   ├── types/
│   └── utils/
├── tests/
│   ├── unit/
│   └── e2e/
└── docs/
    └── claude-code-log.md
```

Keep the code modular. Do not put all business logic inside React components.

## Backend and Data Requirement

The original product does not need login for the MVP, but the rubric explicitly evaluates backend/data. Therefore, implement a minimal Supabase-backed data layer.

Recommended MVP approach:

- Use anonymous/session-based analysis records if full auth is too much for the course timeline.
- Create an `analyses` table for result snapshots or metadata.
- Enable RLS before inserting demo data.
- Prefer storing structured results and timestamps, not raw CV PDFs.
- Put all Supabase writes behind server-only code.
- Keep future authentication easy to add later.

Future-ready capabilities:

- User accounts.
- Saved analyses.
- Analysis history.
- Exported documents.
- Supabase Auth + Supabase Database.

## Core Domain Concepts

### CV Data

Expected normalized shape:

```ts
type CvProfile = {
  name?: string;
  summary?: string;
  experience: Array<{
    role?: string;
    company?: string;
    period?: string;
    description?: string;
    achievements?: string[];
  }>;
  education: Array<{
    institution?: string;
    degree?: string;
    period?: string;
  }>;
  skills: string[];
  projects: Array<{
    name?: string;
    description?: string;
    technologies?: string[];
  }>;
};
```

### Job Offer Data

Expected normalized shape:

```ts
type JobOffer = {
  role?: string;
  company?: string;
  seniority?: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  responsibilities: string[];
  keywords: string[];
};
```

### Match Result

Expected analysis shape:

```ts
type MatchAnalysis = {
  score: number;
  strengths: string[];
  gaps: string[];
  missingKeywords: string[];
  recommendations: string[];
};
```

## UX Requirements

The first MVP should include:

1. Landing/input screen.
2. PDF upload control.
3. Job description text area.
4. Analyze button.
5. Loading state while AI works.
6. Results dashboard with sections:
   - Score.
   - Strengths.
   - Gaps.
   - Keywords.
   - Recommendations.
   - Generated LinkedIn content.
   - Generated cover letter.
7. Clear error states for invalid PDF, failed extraction, invalid AI response, unavailable AI server, and backend persistence failure.

## Engineering Guidelines

- Use TypeScript strictly where possible.
- Validate AI outputs before rendering them.
- Prefer schemas for structured AI responses.
- Keep prompts versioned in code, not inline everywhere.
- Handle PDF extraction errors gracefully.
- Handle local AI server unavailability with a clear error message.
- Avoid making claims that the score is objectively correct; it is an approximate recommendation score.
- Do not store uploaded CVs permanently in the MVP unless explicitly implemented with user consent.
- Do not expose private environment variables to the browser.
- Include testable pure functions for scoring, validation, mapping, and prompt formatting.

## Suggested Implementation Phases

### Phase 1 — Foundation

- Initialize Next.js app.
- Configure styling.
- Create basic layout.
- Implement PDF upload and text extraction.

### Phase 2 — Local AI Integration

- Add AI provider abstraction.
- Implement Qwen/Ollama provider.
- Add health/error handling.

### Phase 3 — Structured Analysis

- Implement CV normalization prompt.
- Implement job offer analysis prompt.
- Implement matching prompt.
- Validate structured output.

### Phase 4 — Generated Assets

- Generate optimized professional summary.
- Generate LinkedIn headline/about.
- Generate cover letter.

### Phase 5 — Backend/Data for Rubric

- Configure Supabase project and environment variables.
- Add minimal `analyses` persistence.
- Enable RLS policies.
- Ensure endpoints/server actions are protected and secrets are server-only.

### Phase 6 — Testing and CI

- Add Vitest unit test for a pure domain function or schema validation.
- Add Playwright E2E test for the main user flow or a mocked analysis flow.
- Configure CI to run unit and E2E tests.

### Phase 7 — Demo Preparation

- Prepare a 5-minute script.
- Prepare stable demo data.
- Verify the local AI server is running before presenting.
- Be ready with screenshots as backup, but prioritize live demo.

## Definition of Done for MVP

The MVP is complete when:

- A user can upload a PDF CV.
- A user can paste a job offer.
- The app extracts the PDF text.
- The local Qwen2.5 7B model analyzes the content.
- The app renders a useful dashboard.
- The system does not invent user experience.
- Supabase is configured with RLS for the data used by the app.
- No sensitive data or keys are exposed client-side.
- At least one Vitest unit test and one Playwright E2E test pass in CI.
- The demo can be explained clearly in under 5 minutes.
