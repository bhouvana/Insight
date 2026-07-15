export const SCORE_DIMENSIONS = [
  "problemClarity",
  "marketNeed",
  "originality",
  "differentiation",
  "technicalFeasibility",
  "businessPotential",
  "executionComplexity",
  "risk",
  "defensibility",
  "aiLeverage",
] as const;

export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

/**
 * All ten fields are 0-10, and higher always means "more build-ready."
 * For `executionComplexity` and `risk` specifically, the caller must score
 * *manageability*, not the raw complexity/risk level: 10 = very manageable /
 * low risk, 0 = extremely complex / high risk. This keeps the aggregation in
 * scoring.ts a plain weighted average with no per-field inversion logic.
 */
export type DimensionScores = Record<ScoreDimension, number>;

export type DimensionWeights = Record<ScoreDimension, number>;

export type DimensionRationale = Partial<Record<ScoreDimension, string>>;

export interface ScoreInput {
  dimensions: DimensionScores;
  rationale?: DimensionRationale | undefined;
}

export type RecommendationBand = "Go" | "Pivot" | "Pause";

export interface BandThresholds {
  /** Overall score (0-100) at or above which the band is "Go". */
  go: number;
  /** Overall score (0-100) at or above which the band is "Pivot" (below `go`). Below this is "Pause". */
  pivot: number;
}

export interface ScoreResult {
  dimensions: DimensionScores;
  /** 0-100, one decimal place. */
  overall: number;
  band: RecommendationBand;
  rationale?: DimensionRationale | undefined;
}

export class ScoreValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = "ScoreValidationError";
  }
}

export interface SessionScoreEntry {
  timestamp: string;
  input: ScoreInput;
  result: ScoreResult;
}

export interface SessionRecord {
  ideaSlug: string;
  ideaSummary: string;
  createdAt: string;
  updatedAt: string;
  /** Append-only, newest last. */
  history: SessionScoreEntry[];
}

export interface SessionSummary {
  ideaSlug: string;
  ideaSummary: string;
  latestOverall: number;
  latestBand: RecommendationBand;
  updatedAt: string;
  runCount: number;
}
