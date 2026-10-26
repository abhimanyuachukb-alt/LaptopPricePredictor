import { useState } from 'react';
import {
  CONFUSION_MATRIX,
  PRICE_TIERS,
  MODEL_METRICS,
  getTierMetrics,
  getPriceTierIndex,
} from '../model/evaluationData';
import { Grid, Target, Percent, Award, ChevronRight } from 'lucide-react';

interface ConfusionMatrixProps {
  currentPrice: number | null;
}

export function ConfusionMatrix({ currentPrice }: ConfusionMatrixProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const tierMetrics = getTierMetrics();
  const currentTierIndex = currentPrice !== null ? getPriceTierIndex(currentPrice) : null;

  // Maximum value in matrix to normalize color intensity
  const maxVal = Math.max(...CONFUSION_MATRIX.flat());

  const getCellColor = (val: number, isDiagonal: boolean) => {
    if (val === 0) return 'bg-slate-50 text-slate-300 border-slate-100';
    const intensity = val / maxVal;

    if (isDiagonal) {
      if (intensity > 0.6) return 'bg-[#0D2B5E] text-white font-bold border-[#0D2B5E]';
      if (intensity > 0.3) return 'bg-[#1E5AA8] text-white font-bold border-[#1E5AA8]';
      return 'bg-blue-600 text-white font-semibold border-blue-600';
    } else {
      // Off-diagonal misclassifications
      if (val > 40) return 'bg-amber-100/90 text-amber-900 border-amber-200 font-medium';
      if (val > 20) return 'bg-amber-50 text-amber-800 border-amber-100';
      return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 sm:p-5 space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-[#0D2B5E] flex items-center gap-2">
            <Grid className="w-5 h-5 text-[#1E5AA8]" />
            <span>Price Tier Confusion Matrix</span>
          </h2>
          <p className="text-xs text-slate-500">
            Model classification performance across budget, mid-range, premium, and flagship tiers
          </p>
        </div>

        {/* Current user tier indicator */}
        {currentTierIndex !== null && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Your Laptop: {PRICE_TIERS[currentTierIndex].name}</span>
          </div>
        )}
      </div>

      {/* Top Level Metric Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#F4F7FC] rounded-lg p-3 border border-slate-200/60 text-center">
          <p className="text-[11px] font-medium text-slate-500 flex items-center justify-center gap-1">
            <Award className="w-3.5 h-3.5 text-[#1E5AA8]" />
            Tier Accuracy
          </p>
          <p className="text-xl font-bold text-[#0D2B5E] mt-0.5">
            {(MODEL_METRICS.tierAccuracy * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-400">812 / 1000 test cases</p>
        </div>

        <div className="bg-[#F4F7FC] rounded-lg p-3 border border-slate-200/60 text-center">
          <p className="text-[11px] font-medium text-slate-500 flex items-center justify-center gap-1">
            <Target className="w-3.5 h-3.5 text-[#1E5AA8]" />
            Diagonal Matches
          </p>
          <p className="text-xl font-bold text-[#0D2B5E] mt-0.5">812</p>
          <p className="text-[10px] text-slate-400">Exact tier match</p>
        </div>

        <div className="bg-[#F4F7FC] rounded-lg p-3 border border-slate-200/60 text-center">
          <p className="text-[11px] font-medium text-slate-500 flex items-center justify-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
            1-Tier Deviation
          </p>
          <p className="text-xl font-bold text-amber-700 mt-0.5">188</p>
          <p className="text-[10px] text-slate-400">Adjacent tier errors</p>
        </div>

        <div className="bg-[#F4F7FC] rounded-lg p-3 border border-slate-200/60 text-center">
          <p className="text-[11px] font-medium text-slate-500 flex items-center justify-center gap-1">
            <Percent className="w-3.5 h-3.5 text-emerald-600" />
            2+ Tier Error
          </p>
          <p className="text-xl font-bold text-emerald-700 mt-0.5">0.0%</p>
          <p className="text-[10px] text-slate-400">0 extreme misses</p>
        </div>
      </div>

      {/* The Heatmap Grid */}
      <div className="overflow-x-auto pt-1">
        <div className="min-w-[480px]">
          {/* Top Column Header */}
          <div className="text-center pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D2B5E]">
              Predicted Price Tier →
            </span>
          </div>

          <div className="grid grid-cols-[140px_repeat(4,1fr)] gap-1.5 text-xs">
            {/* Empty top-left cell */}
            <div className="flex items-end justify-end p-2 text-slate-400 font-medium text-[11px]">
              Actual Tier ↓
            </div>

            {/* Column labels */}
            {PRICE_TIERS.map((tier, colIdx) => {
              const isUserCol = currentTierIndex === colIdx;
              return (
                <div
                  key={colIdx}
                  className={`p-2 text-center rounded-lg transition-colors ${
                    isUserCol
                      ? 'bg-emerald-100 text-emerald-900 font-bold ring-2 ring-emerald-400'
                      : 'bg-slate-100 text-slate-700 font-semibold'
                  }`}
                >
                  <div>{tier.shortName}</div>
                  <div className="text-[10px] opacity-75 font-normal">{tier.rangeLabel}</div>
                </div>
              );
            })}

            {/* Grid rows */}
            {PRICE_TIERS.map((rowTier, rowIdx) => {
              const rowTotal = CONFUSION_MATRIX[rowIdx].reduce((a, b) => a + b, 0);
              return (
                <div key={rowIdx} className="contents">
                  {/* Row label */}
                  <div className="flex flex-col justify-center px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200/50">
                    <span className="font-semibold text-slate-800">{rowTier.name}</span>
                    <span className="text-[10px] text-slate-500">{rowTier.rangeLabel}</span>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                      n = {rowTotal}
                    </span>
                  </div>

                  {/* 4 columns for this row */}
                  {CONFUSION_MATRIX[rowIdx].map((val, colIdx) => {
                    const isDiagonal = rowIdx === colIdx;
                    const pctOfRow = Math.round((val / rowTotal) * 100);
                    const isSelected =
                      selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                    const isUserCell =
                      currentTierIndex === colIdx && isDiagonal;

                    return (
                      <button
                        type="button"
                        key={colIdx}
                        onClick={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                        className={`relative p-2.5 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${getCellColor(
                          val,
                          isDiagonal
                        )} ${
                          isSelected ? 'ring-2 ring-blue-500 scale-[1.03] z-10' : 'hover:scale-[1.01]'
                        } ${isUserCell ? 'outline outline-2 outline-emerald-400 outline-offset-1' : ''}`}
                      >
                        <span className="text-sm">{val}</span>
                        {val > 0 && (
                          <span
                            className={`text-[10px] opacity-80 ${
                              isDiagonal && val > 100 ? 'text-blue-100' : ''
                            }`}
                          >
                            {pctOfRow}%
                          </span>
                        )}
                        {isDiagonal && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Cell Detail or Default Callout */}
      <div className="p-3 bg-[#F4F7FC] rounded-lg border border-slate-200/70 text-xs text-slate-700">
        {selectedCell ? (
          <div>
            <div className="font-semibold text-[#0D2B5E] mb-1">
              Cell Detail: Actual {PRICE_TIERS[selectedCell.row].name} → Predicted{' '}
              {PRICE_TIERS[selectedCell.col].name}
            </div>
            <p>
              Count: <span className="font-bold">{CONFUSION_MATRIX[selectedCell.row][selectedCell.col]}</span> laptops
              ({((CONFUSION_MATRIX[selectedCell.row][selectedCell.col] / MODEL_METRICS.totalTestSamples) * 100).toFixed(1)}% of all test cases).
              {selectedCell.row === selectedCell.col
                ? ' Correctly predicted within this price category (True Positive).'
                : ` Misclassified by ${Math.abs(selectedCell.row - selectedCell.col)} tier(s).`}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0D2B5E] inline-block"></span>
              Dark blue cells along the diagonal indicate correct tier predictions.
            </span>
            <span className="text-slate-400">Click any cell to inspect details</span>
          </div>
        )}
      </div>

      {/* Performance by Tier Table */}
      <div className="space-y-2 pt-1">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          Per-Tier Classification Metrics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-1.5 px-2">Price Tier</th>
                <th className="py-1.5 px-2">Range</th>
                <th className="py-1.5 px-2 text-right">Precision</th>
                <th className="py-1.5 px-2 text-right">Recall</th>
                <th className="py-1.5 px-2 text-right">F1-Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tierMetrics.map((m, idx) => {
                const isUserTier = currentTierIndex === idx;
                return (
                  <tr
                    key={m.tier}
                    className={`${isUserTier ? 'bg-emerald-50/60 font-semibold text-emerald-950' : 'hover:bg-slate-50'}`}
                  >
                    <td className="py-2 px-2 flex items-center gap-1.5">
                      {isUserTier && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                      {m.tier}
                    </td>
                    <td className="py-2 px-2 text-slate-500 font-mono text-[11px]">{m.rangeLabel}</td>
                    <td className="py-2 px-2 text-right font-mono">{(m.precision * 100).toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right font-mono">{(m.recall * 100).toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right font-mono text-[#0D2B5E] font-bold">
                      {(m.f1 * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
