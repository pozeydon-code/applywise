import { describe, it, expect } from "vitest";
import { normalizeScore, scoreLabel } from "@/shared/utils/score";

describe("normalizeScore", () => {
  it("clamps values above 100 to 100", () => {
    expect(normalizeScore(150)).toBe(100);
  });

  it("clamps negative values to 0", () => {
    expect(normalizeScore(-10)).toBe(0);
  });

  it("rounds decimal scores", () => {
    expect(normalizeScore(72.7)).toBe(73);
  });

  it("returns exact values in range", () => {
    expect(normalizeScore(85)).toBe(85);
  });
});

describe("scoreLabel", () => {
  it("returns high for scores >= 70", () => {
    expect(scoreLabel(70)).toBe("high");
    expect(scoreLabel(95)).toBe("high");
  });

  it("returns medium for scores between 50 and 69", () => {
    expect(scoreLabel(50)).toBe("medium");
    expect(scoreLabel(69)).toBe("medium");
  });

  it("returns low for scores below 50", () => {
    expect(scoreLabel(0)).toBe("low");
    expect(scoreLabel(49)).toBe("low");
  });
});
