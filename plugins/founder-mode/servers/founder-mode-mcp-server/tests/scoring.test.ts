import { describe, expect, it } from "vitest";
import { bandFor, scoreReadiness } from "../src/scoring.js";
import { SCORE_DIMENSIONS, ScoreValidationError, type DimensionScores, type ScoreInput } from "../src/types.js";

function uniformInput(value: number): ScoreInput {
  const dimensions = Object.fromEntries(
    SCORE_DIMENSIONS.map((dimension) => [dimension, value]),
  ) as DimensionScores;
  return { dimensions };
}

describe("scoreReadiness", () => {
  it("is deterministic: identical input produces byte-identical output", () => {
    const input = uniformInput(6.3);
    const first = scoreReadiness(input);
    const second = scoreReadiness(input);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("bands exactly 75 as Go (upper boundary, inclusive)", () => {
    const result = scoreReadiness(uniformInput(7.5));
    expect(result.overall).toBe(75);
    expect(result.band).toBe("Go");
  });

  it("bands just below 75 as Pivot, not Go", () => {
    const result = scoreReadiness(uniformInput(7.4));
    expect(result.overall).toBeCloseTo(74, 5);
    expect(result.band).toBe("Pivot");
  });

  it("bands exactly 50 as Pivot (lower boundary, inclusive)", () => {
    const result = scoreReadiness(uniformInput(5.0));
    expect(result.overall).toBe(50);
    expect(result.band).toBe("Pivot");
  });

  it("bands just below 50 as Pause, not Pivot", () => {
    const result = scoreReadiness(uniformInput(4.9));
    expect(result.overall).toBeCloseTo(49, 5);
    expect(result.band).toBe("Pause");
  });

  it("bands 0 as Pause and 10 (=100) as Go", () => {
    expect(scoreReadiness(uniformInput(0)).band).toBe("Pause");
    expect(scoreReadiness(uniformInput(10)).overall).toBe(100);
    expect(scoreReadiness(uniformInput(10)).band).toBe("Go");
  });

  it("throws ScoreValidationError naming the exact field when a dimension is out of range", () => {
    const input = uniformInput(5);
    input.dimensions.marketNeed = 11;
    expect(() => scoreReadiness(input)).toThrow(ScoreValidationError);
    try {
      scoreReadiness(input);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ScoreValidationError);
      expect((err as InstanceType<typeof ScoreValidationError>).field).toBe("marketNeed");
    }
  });

  it("throws ScoreValidationError naming the exact field when a dimension is missing", () => {
    const input = uniformInput(5);
    delete (input.dimensions as Partial<DimensionScores>).aiLeverage;
    try {
      scoreReadiness(input);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ScoreValidationError);
      expect((err as InstanceType<typeof ScoreValidationError>).field).toBe("aiLeverage");
    }
  });

  it("throws ScoreValidationError when a dimension is not a number", () => {
    const input = uniformInput(5);
    // @ts-expect-error deliberately wrong type to test runtime validation
    input.dimensions.originality = "high";
    expect(() => scoreReadiness(input)).toThrow(ScoreValidationError);
  });

  it("passes rationale through unchanged without affecting the score", () => {
    const input: ScoreInput = { ...uniformInput(8), rationale: { founderFit: "n/a" } as never };
    const result = scoreReadiness(input);
    expect(result.overall).toBe(80);
  });

  it("weighting a single dimension to zero excludes it from the average", () => {
    const input = uniformInput(10);
    input.dimensions.risk = 0; // a bad risk score, but risk is weighted out below
    const weights = Object.fromEntries(SCORE_DIMENSIONS.map((d) => [d, d === "risk" ? 0 : 1 / 9]));
    const result = scoreReadiness(input, weights as never);
    expect(result.overall).toBe(100);
  });
});

describe("bandFor", () => {
  it("uses custom thresholds when provided", () => {
    expect(bandFor(90, { go: 95, pivot: 80 })).toBe("Pivot");
    expect(bandFor(96, { go: 95, pivot: 80 })).toBe("Go");
    expect(bandFor(79, { go: 95, pivot: 80 })).toBe("Pause");
  });
});
