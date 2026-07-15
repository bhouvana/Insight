import { DEFAULT_BANDS, DEFAULT_WEIGHTS } from "./config.js";
import {
  SCORE_DIMENSIONS,
  ScoreValidationError,
  type BandThresholds,
  type DimensionWeights,
  type RecommendationBand,
  type ScoreInput,
  type ScoreResult,
} from "./types.js";

export function validateScoreInput(input: ScoreInput): void {
  if (input == null || typeof input.dimensions !== "object") {
    throw new ScoreValidationError("dimensions", 'Missing required "dimensions" object.');
  }
  for (const dimension of SCORE_DIMENSIONS) {
    const value = input.dimensions[dimension];
    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new ScoreValidationError(
        dimension,
        `Dimension "${dimension}" must be a number, got ${JSON.stringify(value)}.`,
      );
    }
    if (value < 0 || value > 10) {
      throw new ScoreValidationError(
        dimension,
        `Dimension "${dimension}" must be between 0 and 10, got ${value}.`,
      );
    }
  }
}

export function bandFor(overall: number, bands: BandThresholds = DEFAULT_BANDS): RecommendationBand {
  if (overall >= bands.go) return "Go";
  if (overall >= bands.pivot) return "Pivot";
  return "Pause";
}

/**
 * Deterministic: identical input, weights, and bands always produce
 * byte-identical output. No I/O, no randomness, no reliance on wall-clock
 * time — this is what makes the Build Readiness Score reproducible instead
 * of an LLM re-deriving a "vibe" each run (see PROJECT_SPEC.md §9.4).
 */
export function scoreReadiness(
  input: ScoreInput,
  weights: DimensionWeights = DEFAULT_WEIGHTS,
  bands: BandThresholds = DEFAULT_BANDS,
): ScoreResult {
  validateScoreInput(input);

  const weightSum = SCORE_DIMENSIONS.reduce((sum, dimension) => sum + weights[dimension], 0);
  if (weightSum <= 0) {
    throw new ScoreValidationError("weights", "Sum of dimension weights must be greater than zero.");
  }

  const weightedSum = SCORE_DIMENSIONS.reduce(
    (sum, dimension) => sum + input.dimensions[dimension] * weights[dimension],
    0,
  );
  const average = weightedSum / weightSum; // 0-10 scale
  const overall = Math.round(average * 100) / 10; // 0-100 scale, 1 decimal

  return {
    dimensions: { ...input.dimensions },
    overall,
    band: bandFor(overall, bands),
    rationale: input.rationale,
  };
}
