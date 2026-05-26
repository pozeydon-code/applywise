import { describe, it, expect } from "vitest";
import type { AnalysisRow } from "@/shared/types/database";

// Pure mapping: summary fields extracted from a full row
function toSummary(row: AnalysisRow) {
  return {
    id: row.id,
    created_at: row.created_at,
    job_role: row.job_role,
    score: row.score,
  };
}

const MOCK_ROW: AnalysisRow = {
  id: "abc-123",
  created_at: "2026-05-18T00:00:00Z",
  job_role: "Frontend Engineer",
  score: 78,
  user_id: "user-uuid-123",
  result_snapshot: {
    cvProfile: { experience: [], education: [], skills: [], projects: [] },
    jobOffer: { requiredSkills: [], niceToHaveSkills: [], responsibilities: [], keywords: [] },
    matchAnalysis: { score: 78, strengths: [], gaps: [], missingKeywords: [], recommendations: [] },
    generatedAssets: {
      optimizedSummary: "",
      linkedinHeadline: "",
      linkedinAbout: "",
      coverLetter: "",
    },
    applicationKit: {
      cvComparison: { before: "", after: "", improvements: [] },
      interviewQuestions: [],
      checklist: [],
    },
  },
};

describe("toSummary", () => {
  it("extracts only summary fields from a full row", () => {
    const summary = toSummary(MOCK_ROW);
    expect(summary).toEqual({
      id: "abc-123",
      created_at: "2026-05-18T00:00:00Z",
      job_role: "Frontend Engineer",
      score: 78,
    });
    expect((summary as Record<string, unknown>).result_snapshot).toBeUndefined();
  });

  it("preserves null job_role", () => {
    const row: AnalysisRow = { ...MOCK_ROW, job_role: null };
    expect(toSummary(row).job_role).toBeNull();
  });
});
