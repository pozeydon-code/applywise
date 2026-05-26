import type { CvProfile, GeneratedAssets, JobOffer, MatchAnalysis } from "@/shared/types/domain";

export function buildApplicationKitPrompt(
  cv: CvProfile,
  job: JobOffer,
  match: MatchAnalysis,
  assets: GeneratedAssets
): string {
  return `
Create an application kit for this candidate applying to this job.

CANDIDATE PROFILE:
${JSON.stringify(cv, null, 2)}

JOB OFFER:
${JSON.stringify(job, null, 2)}

MATCH ANALYSIS:
${JSON.stringify(match, null, 2)}

GENERATED ASSETS:
${JSON.stringify(assets, null, 2)}

Return a JSON object matching this structure:
{
  "cvComparison": {
    "before": string (brief summary of the original CV positioning),
    "after": string (brief improved positioning using only verified information),
    "improvements": string[] (specific edits the candidate can make truthfully)
  },
  "interviewQuestions": [
    {
      "question": string (likely interview question for this role),
      "honestAnswer": string (suggested answer based only on CV, job, and match data),
      "evidence": string (what CV/job/match evidence supports this answer, or what evidence is missing)
    }
  ],
  "checklist": string[] (final application checklist and recommendations)
}

CRITICAL ETHICAL RULES:
- Do NOT invent experience, companies, degrees, years, achievements, metrics, or skills.
- Interview answers must be honest and based only on the candidate profile, job offer, match analysis, and generated assets.
- If evidence is missing, say so explicitly and suggest how the candidate can answer truthfully.
- It is allowed to recommend adding missing information only if the candidate truly has it.
- Keep the kit practical, concise, and ready to copy into a Markdown export.
`.trim();
}
