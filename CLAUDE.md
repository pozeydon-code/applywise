# CLAUDE.md

## Working Agreement

You are continuing a project planning/building session. The user wants to build a course project about AI.

The selected project is **ApplyWise**, a web app for intelligent CV, LinkedIn, and cover-letter optimization.

The user preferences already established:

1. It must be a **web app**.
2. The user will **upload the CV as PDF**.
3. The AI model is **local Qwen2.5 7B**.
4. The MVP originally did not require login, but the evaluation rubric requires a real backend/data layer. Therefore, implement minimal Supabase persistence with RLS while keeping full auth optional/future-ready.

Always align decisions with `rubrica_evaluacion.pdf`.

## Rubric Priorities

The final evaluation is out of 15 points. Build for the highest score:

1. **Core functionality — 3 pts**
   - The main flow must run end-to-end without visible errors.
   - User can complete the key task: PDF CV + job offer → analysis dashboard.

2. **Claude Code usage — 3 pts**
   - Claude Code must be used meaningfully, not only for isolated snippets.
   - Keep evidence of iterative prompting, context usage, refactors, tests, and decisions in `docs/claude-code-log.md` or equivalent.
   - Every meaningful Claude Code or agent session must append a concise entry to `docs/claude-code-log.md`.

3. **Architecture and code — 2 pts**
   - Clear folder structure.
   - Separation of responsibilities.
   - No business logic mixed into UI components.

4. **Backend and data — 2 pts**
   - Supabase configured with RLS.
   - Protected endpoints/server actions.
   - No sensitive keys or data exposed.

5. **Testing — 2 pts**
   - At least one Vitest unit test.
   - At least one Playwright E2E test.
   - Tests passing in CI.

6. **Demo and clarity — 3 pts**
   - Live demo under 5 minutes.
   - Explain the problem, stack, and role of AI clearly.

## What to Build

Build a web app where the user uploads a PDF CV and pastes a job description. The app extracts the PDF text, analyzes the CV against the job offer using local AI, saves minimal analysis metadata/results through Supabase, and returns a dashboard with compatibility analysis and generated career assets.

## Mandatory Claude Code Log Rule

Maintain `docs/claude-code-log.md` as part of the project deliverable. This is required evidence for the rubric category “Uso de Claude Code”.

After any meaningful AI-assisted session, append a short entry with:

- Date/session.
- Prompt or task summary.
- What Claude/agent helped with.
- Files or areas changed.
- Decision made or issue solved.
- Next step.

This applies to planning, implementation, refactors, debugging, tests, CI, Supabase setup, demo preparation, and architecture decisions.

Do not fill this file only at the end. It should show an iterative development process using context and progressively improving the project.

## MVP Output

The app should produce:

- Compatibility score.
- Strengths.
- Weaknesses or gaps.
- Missing keywords.
- Recommendations.
- Optimized professional summary.
- LinkedIn headline.
- LinkedIn about section.
- Cover letter for the job offer.

## Local AI Notes

Use **Qwen2.5 7B locally**.

The model may run through:

- Ollama.
- LM Studio.
- Any OpenAI-compatible local server.

Prefer designing an abstraction like:

```ts
interface AiProvider {
  generateText(input: GenerateTextInput): Promise<string>;
  generateJson<T>(input: GenerateJsonInput): Promise<T>;
}
```

Do not tightly couple all code to one provider implementation.

## Critical Prompting Rule

Do not ask the local 7B model to do everything in one giant prompt.

Use a staged pipeline:

```txt
PDF → extracted text → structured CV → structured job offer → match analysis → generated assets → persisted result snapshot
```

This is important because smaller local models can lose structure or hallucinate when overloaded.

## Ethical / Product Rule

The system must not fabricate career information.

Strong rule for prompts:

```txt
Do not invent skills, companies, roles, education, achievements, metrics, dates, or years of experience.
Only improve wording, structure, clarity, emphasis, and alignment with the job offer based on the provided CV.
If information is missing, recommend that the user adds it manually instead of inventing it.
```

## Recommended Stack

Use this unless the user says otherwise:

- Next.js.
- TypeScript.
- Tailwind CSS.
- shadcn/ui if useful.
- Server-side PDF parsing.
- Local AI provider adapter.
- Supabase for backend/data and RLS.
- Vitest for unit tests.
- Playwright for E2E tests.
- GitHub Actions or equivalent CI.

## Suggested Folder Structure

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

Keep business logic out of UI components.

## Backend and Data Requirement

The rubric gives points for backend/data. Do not ignore this.

Implement a minimal Supabase layer:

- Store analysis metadata and/or generated result snapshots.
- Avoid permanently storing uploaded raw CV PDFs unless the user explicitly consents.
- Enable RLS on every table.
- Use server-only Supabase clients for privileged operations.
- Never expose service-role keys in client code.
- Keep endpoints/server actions protected and validated.

Full login can remain future-ready, but the data layer must be real enough to demonstrate Supabase + RLS.

Potential future features:

- Saved analyses.
- User history.
- Exported CV versions.
- Subscription limits.

## First Implementation Recommendation

Start with the foundation, but keep the rubric visible:

1. Initialize the web app.
2. Create a simple UI for PDF upload and job description input.
3. Extract PDF text server-side.
4. Add local AI provider health check.
5. Implement one end-to-end analysis path.
6. Add Supabase persistence with RLS.
7. Add one Vitest unit test.
8. Add one Playwright E2E test.
9. Add CI to run tests.
10. Refine architecture and demo flow.

## Suggested Agent Modules

Even if implemented as functions, conceptually structure them as agents:

1. **CV Parser Agent**
   - Input: extracted PDF text.
   - Output: structured CV profile.

2. **Job Analyzer Agent**
   - Input: raw job description.
   - Output: structured job requirements.

3. **Match Evaluator Agent**
   - Input: structured CV + structured job offer.
   - Output: score, strengths, gaps, keywords, recommendations.

4. **Profile Generator Agent**
   - Input: CV + job offer + match analysis.
   - Output: LinkedIn content, optimized summary, cover letter.

5. **Persistence Module**
   - Input: analysis result snapshot/metadata.
   - Output: saved analysis record through Supabase with RLS.

## Testing Targets

Minimum evaluation-safe testing setup:

- **Unit test:** validate a pure function or schema, such as score normalization, AI JSON validation, or match result mapping.
- **E2E test:** verify that the main page renders and the user can start/complete an analysis flow. Mock local AI if needed for CI stability.
- **CI:** run lint/typecheck/unit/E2E or at minimum Vitest + Playwright in GitHub Actions.

## Presentation Angle for the Course

When explaining the project, emphasize:

- Privacy: CV data can stay local and is not sent to paid cloud AI APIs.
- Cost control: no paid API dependency.
- Multi-step AI pipeline.
- Structured AI outputs and schema validation.
- Supabase backend with RLS for safe persistence.
- Human-in-the-loop: recommendations need user validation.
- Ethical constraint: the system does not invent professional experience.
- Claude Code was used iteratively as a development copilot.

## Demo Script Target

Keep the demo under 5 minutes:

1. Problem: job seekers need tailored CV/LinkedIn/cover-letter feedback.
2. Stack: Next.js, TypeScript, Tailwind, local Qwen2.5 7B, Supabase, Vitest, Playwright.
3. Flow: upload CV PDF, paste job offer, run analysis, view dashboard.
4. Architecture: staged AI pipeline and provider abstraction.
5. Safety: no hallucinated experience, validated outputs, no exposed secrets, RLS.
6. Claude Code: mention iterative assistance and where it improved the project.

## Known Risks

- PDF extraction may lose formatting.
- Qwen2.5 7B may produce malformed JSON.
- Long CVs and long job descriptions may exceed comfortable context size.
- The compatibility score is heuristic, not objective truth.
- Local AI server may be unavailable.
- Supabase configuration/RLS can cost rubric points if incomplete.
- E2E tests can be flaky if they depend on the real local AI model; mock AI in CI when needed.

Handle these with clear errors, validation, mocks for tests, and demo preparation.

## Tone with the User

The user speaks Spanish. Respond in Rioplatense Spanish with voseo when discussing decisions or explaining tradeoffs.

Be direct, practical, and architectural. Avoid building randomly without first explaining the plan.
