import { SCORE_DIMENSIONS, type BandThresholds, type DimensionWeights } from "./types.js";

/** Equal weighting by default — no dimension is assumed more important until evidence says otherwise. */
export const DEFAULT_WEIGHTS: DimensionWeights = Object.fromEntries(
  SCORE_DIMENSIONS.map((dimension) => [dimension, 0.1]),
) as DimensionWeights;

export const DEFAULT_BANDS: BandThresholds = {
  go: 75,
  pivot: 50,
};
