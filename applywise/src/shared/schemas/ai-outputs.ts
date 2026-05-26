import { z } from "zod";

// Local 7B models often return null instead of [] for empty arrays.
// safeArray coerces null/undefined/invalid to [].
const safeArray = <T>(item: z.ZodType<T>) =>
  z.array(item).nullish().transform((v) => v ?? []);

// Similarly, strings may come back as null instead of undefined.
const safeString = z.string().nullish().transform((v) => v ?? undefined);

export const CvProfileSchema = z.object({
  name: safeString,
  summary: safeString,
  experience: safeArray(
    z.object({
      role: safeString,
      company: safeString,
      period: safeString,
      description: safeString,
      achievements: safeArray(z.string()),
    })
  ),
  education: safeArray(
    z.object({
      institution: safeString,
      degree: safeString,
      period: safeString,
    })
  ),
  skills: safeArray(z.string()),
  projects: safeArray(
    z.object({
      name: safeString,
      description: safeString,
      technologies: safeArray(z.string()),
    })
  ),
});

export const JobOfferSchema = z.object({
  role: safeString,
  company: safeString,
  seniority: safeString,
  requiredSkills: safeArray(z.string()),
  niceToHaveSkills: safeArray(z.string()),
  responsibilities: safeArray(z.string()),
  keywords: safeArray(z.string()),
});

export const MatchAnalysisSchema = z.object({
  score: z.number().min(0).max(100).catch(0),
  strengths: safeArray(z.string()),
  gaps: safeArray(z.string()),
  missingKeywords: safeArray(z.string()),
  recommendations: safeArray(z.string()),
});

export const GeneratedAssetsSchema = z.object({
  optimizedSummary: z.string().catch(""),
  linkedinHeadline: z.string().catch(""),
  linkedinAbout: z.string().catch(""),
  coverLetter: z.string().catch(""),
});

export const ApplicationKitSchema = z.object({
  cvComparison: z.object({
    before: z.string().catch(""),
    after: z.string().catch(""),
    improvements: safeArray(z.string()),
  }),
  interviewQuestions: safeArray(
    z.object({
      question: z.string().catch(""),
      honestAnswer: z.string().catch(""),
      evidence: z.string().catch(""),
    })
  ),
  checklist: safeArray(z.string()),
});
