import type { CvProfile, JobOffer, MatchAnalysis } from "@/shared/types/domain";

export function buildAssetsPrompt(
  cv: CvProfile,
  job: JobOffer,
  match: MatchAnalysis
): string {
  return `
Generate professional career assets for this candidate applying to this job.

CANDIDATE PROFILE:
${JSON.stringify(cv, null, 2)}

JOB OFFER:
${JSON.stringify(job, null, 2)}

MATCH ANALYSIS:
${JSON.stringify(match, null, 2)}

Return a JSON object matching this structure:
{
  "optimizedSummary": string (professional summary, max 4 sentences),
  "linkedinHeadline": string (max 120 characters),
  "linkedinAbout": string (max 2000 characters),
  "coverLetter": string (3-4 paragraphs)
}

CRITICAL RULES:
- Do NOT invent experience, companies, skills, achievements, metrics, or dates
- Only rephrase, organize, and emphasize information from the provided profile
- If information is missing, write an honest statement — do NOT fabricate
- Align tone and keywords with the job offer
`.trim();
}
