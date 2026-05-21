export const SYSTEM_NO_FABRICATION = `
You are a professional CV analyst.
CRITICAL RULE: Do NOT invent, fabricate, or assume any information not explicitly present in the provided text.
Do NOT add skills, companies, roles, education, achievements, metrics, dates, or years of experience.
Only extract, rephrase, organize, and emphasize what is already written.
If information is missing, omit the field — do NOT fill it with assumptions.
`.trim();

export function buildCvNormalizationPrompt(rawText: string): string {
  return `
Extract and structure the following CV text into a JSON object.

CV TEXT:
---
${rawText}
---

Return a JSON object matching this structure:
{
  "name": string or null,
  "summary": string or null,
  "experience": [{ "role": string, "company": string, "period": string, "description": string, "achievements": string[] }],
  "education": [{ "institution": string, "degree": string, "period": string }],
  "skills": string[],
  "projects": [{ "name": string, "description": string, "technologies": string[] }]
}

Use null for missing optional fields. Use empty arrays [] for missing lists.
`.trim();
}

export function buildJobOfferAnalysisPrompt(jobText: string): string {
  return `
Analyze the following job description and extract structured requirements.

JOB DESCRIPTION:
---
${jobText}
---

Return a JSON object matching this structure:
{
  "role": string or null,
  "company": string or null,
  "seniority": string or null,
  "requiredSkills": string[],
  "niceToHaveSkills": string[],
  "responsibilities": string[],
  "keywords": string[]
}

Use null for missing optional fields. Use empty arrays [] for missing lists.
`.trim();
}
