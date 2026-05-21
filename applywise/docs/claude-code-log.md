# Claude Code Log — ApplyWise

Evidence log for the "Uso de Claude Code" rubric criterion.

---

## Session 4 — 2026-05-21

**Prompt / task summary:**
Testear el pipeline AI completo con Ollama corriendo en 172.25.16.1 (host WSL2). Debuggear errores de pdf-parse v2 y schema validation.

**What Claude Code helped with:**
- Actualizó OLLAMA_URL a `http://172.25.16.1:11434` en .env.local via `sd`.
- Diagnosticó y resolvió error de pdf-parse v2: el worker de pdfjs-dist no se resolvía en el contexto de bundling de Next.js. Solución: agregar `pdf-parse` y `pdfjs-dist` a `serverExternalPackages` en `next.config.ts`.
- Diagnosticó y resolvió Zod validation error: Qwen2.5:7b devuelve `null` en lugar de `[]` para arrays vacíos. Solución: helper `safeArray` con `.nullish().transform(v => v ?? [])` y `safeString` para campos opcionales. Aplicado a todos los schemas de AI output.
- Creó `scripts/test-pipeline.mjs` para smoke test end-to-end del pipeline.
- Verificó pipeline 200 OK: CV detectado, score calculado, assets generados, guardado en Supabase.

**Files changed:**
- `next.config.ts` — serverExternalPackages: pdf-parse, pdfjs-dist
- `src/shared/schemas/ai-outputs.ts` — safeArray + safeString helpers para robustez con 7B
- `src/tests/e2e/fixtures/sample.pdf` — reemplazado con PDF que tiene texto real
- `scripts/test-pipeline.mjs` — script de smoke test del pipeline completo
- `.env.local` — OLLAMA_URL actualizado a 172.25.16.1

**Issue solved:**
- pdf-parse v2 falla en Next.js bundler porque pdfjs-dist busca su worker con un path relativo al bundle. Fix: serverExternalPackages en next.config.ts saca pdf-parse del bundle y Node.js resuelve los paths normalmente.
- Qwen2.5:7b devuelve null en campos array opcionales. Fix: `safeArray` usa `.nullish().transform(v => v ?? [])` para coercionar null/undefined a [].

**Next step:**
- Commitear y pushear a GitHub para verificar CI verde.
- Preparar demo con CV PDF real del usuario.

---

## Session 3 — 2026-05-21

**Prompt / task summary:**
Phase 2 verification + Phase 3: Supabase connection verified. Mock AI provider for E2E tests. Page Object Model E2E tests with Playwright route interception. GitHub Actions CI updated.

**What Claude Code helped with:**
- Wrote `scripts/verify-supabase.mjs` — tested INSERT / SELECT / DELETE against real Supabase project. All passed.
- Created `MockAiProvider` — deterministic Zod-driven mock, returns valid structured data without calling Ollama.
- Updated `getAiProvider()` factory to read `AI_MOCK=true` env var and use the mock provider.
- Refactored E2E tests to Page Object Model pattern following Playwright skill:
  - `base-page.ts` — shared goto/waitForLoadState
  - `home/home-page.ts` — HomePage POM
  - `analyze/analyze-page.ts` — AnalyzePage POM
  - `fixtures/mock-analysis.ts` — realistic AnalysisResult fixture
  - `fixtures/sample.pdf` — minimal valid PDF for upload tests
- 8 E2E tests covering: render, disabled state, input enable, full analysis flow, tab switching, back navigation, error 503 handling.
- Tests use `page.route('/api/analyze', ...)` to intercept the API — no Ollama needed in CI.
- Updated `playwright.config.ts` — CI webServer env passes `AI_MOCK=true` automatically.
- Updated CI to set `AI_MOCK=true` explicitly in E2E step.

**Files created/changed:**
- `scripts/verify-supabase.mjs`
- `src/server/ai/mock-provider.ts`
- `src/server/ai/index.ts` (added AI_MOCK branching)
- `src/tests/e2e/base-page.ts`
- `src/tests/e2e/home/home-page.ts`
- `src/tests/e2e/home/home.spec.ts` (8 tests)
- `src/tests/e2e/analyze/analyze-page.ts`
- `src/tests/e2e/fixtures/mock-analysis.ts`
- `src/tests/e2e/fixtures/sample.pdf`
- `playwright.config.ts`
- `.github/workflows/ci.yml`

**Decisions made:**
- Playwright route interception (`page.route`) over backend mock env var for E2E — tests the real HTTP layer without needing Ollama.
- `AI_MOCK=true` also kept as a server-level escape hatch for CI's webServer env.
- Playwright system deps (`libnss3`, `libnspr4`, `libasound.so.2`, etc.) not available in WSL2 without sudo. CI (Ubuntu runner + `--with-deps`) handles this automatically. User needs to run `sudo npx playwright install-deps chromium` once locally.

**Issue solved:**
- Playwright Chromium headless shell on WSL2 requires multiple system libs. Resolved via `npx playwright install-deps` on CI. Local: `sudo npx playwright install-deps chromium`.

**Next step:**
- User runs `! sudo npx playwright install-deps chromium` locally.
- Phase 4 (optional): commit to git, push to GitHub, verify CI green on first run.
- Demo prep: start Ollama with Qwen2.5:7b, test with a real CV PDF.

---

## Session 2 — 2026-05-18

**Prompt / task summary:**
Phase 2: Supabase persistence layer — table schema, RLS, typed client, persistence functions, health check update, unit tests.

**What Claude Code helped with:**
- Wrote SQL migration `supabase/migrations/001_analyses.sql` with `analyses` table, RLS enabled, index on `created_at`.
- Defined local `Database` type (`src/shared/types/database.ts`) compatible with supabase-js v2 `GenericSchema` (requires `Tables`, `Views`, `Functions`).
- Refactored `supabaseAdmin` into a lazy singleton `getSupabaseAdmin()` with typed `createClient<Database>`, `persistSession: false`, `autoRefreshToken: false` for server-only use.
- Added `getRecentAnalyses` and `verifyConnection` to the persistence layer.
- Created `GET /api/analyses` endpoint — returns summary only, never exposes full `result_snapshot` in list view.
- Updated `GET /api/health` to check both AI and Supabase connectivity in parallel.
- Added `analyses-mapping.test.ts` unit tests (9 total, all passing).
- Fixed `Database` type error: supabase-js v2 `GenericSchema` requires `Views` and `Functions` keys — added `Record<string, never>` for both.

**Files changed:**
- `supabase/migrations/001_analyses.sql` — new
- `src/shared/types/database.ts` — new
- `src/server/persistence/supabase.ts` — rewritten with lazy singleton + typed client
- `src/server/persistence/analyses.ts` — added getRecentAnalyses + verifyConnection
- `src/app/api/analyses/route.ts` — new GET endpoint
- `src/app/api/health/route.ts` — parallel AI + DB health checks
- `src/tests/unit/analyses-mapping.test.ts` — new
- `.env.local.example` — updated with precise instructions

**Decision made:**
- RLS enabled with NO anon policies → anon clients cannot read/write the table directly. Service role (server-only) bypasses RLS and has full access. This is the most secure setup for a no-auth MVP and still demonstrates RLS for the rubric.
- `result_snapshot` (full JSON) is never returned in the list endpoint — only summary fields.
- `verifyConnection` uses `.limit(1)` probe — minimal cost, confirms table existence and RLS bypass.

**Issue solved:**
- `supabase-js` v2 `createClient<Database>` requires `GenericSchema` which mandates `Views` and `Functions` keys. Added them as `Record<string, never>` to fix the TypeScript error.

**Next step:**
- User provides Supabase credentials → create `.env.local` → run migration in SQL Editor → verify with `GET /api/health`.
- Phase 3: Test full pipeline end-to-end with Ollama + Qwen2.5:7b.

---

## Session 1 — 2026-05-18

**Prompt / task summary:**
Initialize the ApplyWise MVP from scratch following AGENTS.md, CLAUDE.md, and the evaluation rubric. Phase 1: project foundation, modular structure, landing UI, server-side PDF parsing, AI provider abstraction, Supabase persistence scaffold, Vitest unit tests, Playwright E2E tests, and GitHub Actions CI.

**What Claude Code helped with:**
- Read AGENTS.md and CLAUDE.md to derive the full architecture before writing a single line.
- Initialized Next.js 16 + TypeScript + Tailwind with `create-next-app`.
- Created the complete modular folder structure (`features/`, `server/`, `shared/`, `tests/`, `docs/`).
- Defined shared domain types (`CvProfile`, `JobOffer`, `MatchAnalysis`, `GeneratedAssets`, `AnalysisResult`) and Zod v4 schemas for AI output validation.
- Implemented `AiProvider` interface and `OllamaProvider` (OpenAI-compatible local server support).
- Implemented server-side PDF extraction using `pdf-parse` with clear error propagation.
- Scaffolded `supabaseAdmin` (server-only, never exposed to browser) and `saveAnalysis` persistence function.
- Built the 4-step staged AI pipeline in the `/api/analyze` route (CV normalization → job offer analysis → CV/job matching → asset generation).
- Created landing page with PDF upload, job description textarea, and analyze button — no business logic in the component.
- Created analysis dashboard (`/analyze`) with score ring, tabs, section cards, and copy-to-clipboard.
- Added `SYSTEM_NO_FABRICATION` prompt guard across all AI calls to prevent hallucinations.
- Configured Vitest with jsdom environment and path aliases.
- Added `normalizeScore` / `scoreLabel` utilities and their unit tests.
- Added Playwright E2E test for landing page render and button disabled state.
- Configured GitHub Actions CI to run typecheck, Vitest, and Playwright.

**Files created:**
- `src/shared/types/domain.ts`
- `src/shared/schemas/ai-outputs.ts`
- `src/shared/utils/score.ts`
- `src/server/ai/types.ts`, `ollama-provider.ts`, `index.ts`
- `src/server/pdf/extract.ts`
- `src/server/persistence/supabase.ts`, `analyses.ts`
- `src/features/cv-analysis/prompts.ts`
- `src/features/job-matching/prompts.ts`
- `src/features/profile-generation/prompts.ts`
- `src/app/page.tsx` (landing)
- `src/app/analyze/page.tsx` (dashboard)
- `src/app/api/analyze/route.ts` (pipeline orchestration)
- `src/app/api/health/route.ts`
- `src/tests/unit/score.test.ts`
- `src/tests/e2e/home.spec.ts`
- `vitest.config.ts`
- `playwright.config.ts`
- `.github/workflows/ci.yml`
- `.env.local.example`

**Decisions made:**
- Used `sessionStorage` to pass analysis results from API to dashboard (avoids URL size limits, no login required for MVP).
- `saveAnalysis` failure is non-blocking — the UI still gets the result even if Supabase is down.
- Staged AI pipeline (4 separate calls) instead of one giant prompt — critical for Qwen2.5 7B reliability.
- `SYSTEM_NO_FABRICATION` injected into every AI call to enforce the ethical constraint.
- `OllamaProvider` configured via env vars `OLLAMA_URL` and `OLLAMA_MODEL` for easy runtime swap.
- `supabaseAdmin` uses service-role key in server-only code; no Supabase client in browser.
- Zod v4 schemas validate every AI JSON response before rendering.

**Issue solved:**
- Next.js 16 ships its own AGENTS.md warning about breaking changes. Verified `useRouter`, `NextResponse`, and App Router APIs against the bundled docs — all stable.

**Next step:**
- Phase 2: Wire Supabase project (real URL + service role key), create `analyses` table with RLS, verify persistence end-to-end.
- Phase 3: Test the full pipeline with a real Ollama + Qwen2.5:7b instance.
- Phase 4: Run Vitest unit tests and Playwright E2E in CI.
