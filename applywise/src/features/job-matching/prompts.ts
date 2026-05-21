import type { CvProfile, JobOffer } from "@/shared/types/domain";

export function buildMatchPrompt(cv: CvProfile, job: JobOffer): string {
  return `
Evaluate how well this candidate's CV matches the job offer.

CANDIDATE PROFILE:
${JSON.stringify(cv, null, 2)}

JOB OFFER:
${JSON.stringify(job, null, 2)}

Return a JSON object matching this structure:
{
  "score": number (0-100, based only on verifiable profile data),
  "strengths": string[] (list of matching strengths from the CV),
  "gaps": string[] (list of requirements the candidate does not visibly meet),
  "missingKeywords": string[] (keywords from the job not present in the CV),
  "recommendations": string[] (specific improvements the candidate can make — based only on real information)
}

RULES:
- score must reflect only verifiable information
- Do NOT invent skills or experience
- recommendations must say "add X to your CV" not "you have X experience"
`.trim();
}
