/** Clamps and rounds a raw score to [0, 100]. */
export function normalizeScore(raw: number): number {
  return Math.round(Math.min(100, Math.max(0, raw)));
}

/** Returns a label for the score range. */
export function scoreLabel(score: number): "high" | "medium" | "low" {
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  return "low";
}
