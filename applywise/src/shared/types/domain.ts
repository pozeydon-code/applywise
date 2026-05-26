export type CvProfile = {
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

export type JobOffer = {
  role?: string;
  company?: string;
  seniority?: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  responsibilities: string[];
  keywords: string[];
};

export type MatchAnalysis = {
  score: number;
  strengths: string[];
  gaps: string[];
  missingKeywords: string[];
  recommendations: string[];
};

export type GeneratedAssets = {
  optimizedSummary: string;
  linkedinHeadline: string;
  linkedinAbout: string;
  coverLetter: string;
};

export type CvComparison = {
  before: string;
  after: string;
  improvements: string[];
};

export type InterviewQuestion = {
  question: string;
  honestAnswer: string;
  evidence: string;
};

export type ApplicationKit = {
  cvComparison: CvComparison;
  interviewQuestions: InterviewQuestion[];
  checklist: string[];
};

export type AnalysisResult = {
  id?: string;
  createdAt?: string;
  cvProfile: CvProfile;
  jobOffer: JobOffer;
  matchAnalysis: MatchAnalysis;
  generatedAssets: GeneratedAssets;
  applicationKit: ApplicationKit;
};
