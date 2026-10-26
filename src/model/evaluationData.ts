import samplePoints from './testSamplePoints.json';

export interface ScatterPoint {
  actual: number;
  predicted: number;
  brand: string;
  processor: string;
  age: number;
}

export interface TierInfo {
  name: string;
  shortName: string;
  rangeLabel: string;
  min: number;
  max: number;
}

export const PRICE_TIERS: TierInfo[] = [
  { name: 'Budget', shortName: 'Budget', rangeLabel: '< ₹20k', min: 0, max: 20000 },
  { name: 'Mid-range', shortName: 'Mid-range', rangeLabel: '₹20k–₹40k', min: 20000, max: 40000 },
  { name: 'Premium', shortName: 'Premium', rangeLabel: '₹40k–₹70k', min: 40000, max: 70000 },
  { name: 'Flagship', shortName: 'Flagship', rangeLabel: '> ₹70k', min: 70000, max: Infinity },
];

export function getPriceTierIndex(price: number): number {
  if (price < 20000) return 0;
  if (price < 40000) return 1;
  if (price < 70000) return 2;
  return 3;
}

// 4x4 Confusion Matrix on holdout test set (1,000 samples)
// Rows: Actual Price Tier
// Columns: Predicted Price Tier
export const CONFUSION_MATRIX = [
  [467, 54, 0, 0],
  [44, 219, 37, 0],
  [0, 28, 98, 6],
  [0, 0, 19, 28],
];

export const MODEL_METRICS = {
  testR2: 0.8249,
  testMae: 5662,
  nEstimators: 30,
  maxDepth: 10,
  totalTestSamples: 1000,
  tierAccuracy: 0.812, // 81.2%
};

// Calculate per-tier metrics (Precision, Recall, F1)
export function getTierMetrics() {
  return PRICE_TIERS.map((tier, i) => {
    const tp = CONFUSION_MATRIX[i][i];
    const actualTotal = CONFUSION_MATRIX[i].reduce((a, b) => a + b, 0);
    const predTotal = CONFUSION_MATRIX.reduce((sum, row) => sum + row[i], 0);

    const precision = predTotal > 0 ? tp / predTotal : 0;
    const recall = actualTotal > 0 ? tp / actualTotal : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return {
      tier: tier.name,
      rangeLabel: tier.rangeLabel,
      tp,
      actualTotal,
      predTotal,
      precision,
      recall,
      f1,
    };
  });
}

export const TEST_SAMPLE_POINTS: ScatterPoint[] = samplePoints as ScatterPoint[];
