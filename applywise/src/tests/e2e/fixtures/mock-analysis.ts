import type { AnalysisResult } from "@/shared/types/domain";

export const MOCK_ANALYSIS_RESULT: AnalysisResult = {
  id: "test-id-123",
  createdAt: "2026-05-18T00:00:00Z",
  cvProfile: {
    name: "Ana García",
    summary: "Frontend developer with 4 years of experience in React and TypeScript.",
    experience: [
      {
        role: "Frontend Developer",
        company: "TechCorp",
        period: "2022–2026",
        description: "Built scalable SPAs using React and TypeScript.",
        achievements: ["Reduced load time by 30%", "Mentored 2 junior developers"],
      },
    ],
    education: [
      {
        institution: "Universidad de Buenos Aires",
        degree: "Licenciatura en Ciencias de la Computación",
        period: "2017–2022",
      },
    ],
    skills: ["React", "TypeScript", "CSS", "Node.js", "Git"],
    projects: [
      {
        name: "OpenDash",
        description: "Open-source analytics dashboard.",
        technologies: ["React", "D3.js", "PostgreSQL"],
      },
    ],
  },
  jobOffer: {
    role: "Senior Frontend Engineer",
    company: "StartupXYZ",
    seniority: "Senior",
    requiredSkills: ["React", "TypeScript", "GraphQL"],
    niceToHaveSkills: ["Next.js", "Testing"],
    responsibilities: ["Build product features", "Code review", "Collaborate with design"],
    keywords: ["React", "TypeScript", "GraphQL", "frontend", "senior"],
  },
  matchAnalysis: {
    score: 74,
    strengths: ["Strong React experience", "TypeScript proficiency"],
    gaps: ["No GraphQL experience listed"],
    missingKeywords: ["GraphQL", "Apollo"],
    recommendations: [
      "Add GraphQL to your skills if you have experience with it",
      "Highlight any API integration experience",
    ],
  },
  generatedAssets: {
    optimizedSummary:
      "Frontend developer with 4 years of experience delivering scalable React and TypeScript applications. Proven track record of improving performance and mentoring teams.",
    linkedinHeadline: "Frontend Developer | React · TypeScript · Node.js",
    linkedinAbout:
      "I build fast, accessible, and maintainable frontend applications. Currently focused on React ecosystems and TypeScript-first development.",
    coverLetter:
      "Dear Hiring Manager,\n\nI am excited to apply for the Senior Frontend Engineer position at StartupXYZ. With 4 years of experience building scalable SPAs using React and TypeScript, I am confident in my ability to contribute to your product team.\n\nSincerely,\nAna García",
  },
};
