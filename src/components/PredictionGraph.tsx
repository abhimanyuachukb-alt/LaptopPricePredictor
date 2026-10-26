import { useState, useMemo } from 'react';
import { RandomForest } from '../model/randomForest';
import { TEST_SAMPLE_POINTS, MODEL_METRICS } from '../model/evaluationData';
import { TrendingDown, ScatterChart, Info } from 'lucide-react';

interface PredictionGraphProps {
  model: RandomForest;
  currentSelection: Record<string, string>;
  currentAge: number;
  currentPrice: number | null;
}

export function PredictionGraph({
  model,
  currentSelection,
  currentAge,
  currentPrice,
}: PredictionGraphProps) {
  const [activeTab, setActiveTab] = useState<'depreciation' | 'regression'>('depreciation');
  const [hoveredPoint, setHoveredPoint] = useState<{
    age: number;
    price: number;
    deprecPct: number;
  } | null>(null);

  // Compute 0..10 year price curve for the current laptop specs
  const depreciationCurve = useMemo(() => {
    const points: { age: number; price: number; deprecPct: number }[] = [];
    let initialPrice = 1;

    for (let a = 0; a <= 10; a++) {
      const encoded = model.encode(currentSelection, a);
      const rawPrice = model.predict(encoded);
      const rounded = Math.round(rawPrice / 100.0) * 100.0;
      if (a === 0) {
        initialPrice = rounded;
      }
      const deprecPct = Math.round(((initialPrice - rounded) / initialPrice) * 100);
      points.push({ age: a, price: rounded, deprecPct });
    }
    return points;
  }, [model, currentSelection]);

  const maxDeprecPrice = Math.max(...depreciationCurve.map((p) => p.price), 10000);
  const minDeprecPrice = Math.min(...depreciationCurve.map((p) => p.price), 0);

  // Format currency helper
  const formatRupee = (val: number) => {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);
  };

  // SVG dimensions for Depreciation graph
  const dWidth = 560;
  const dHeight = 240;
  const dPadding = { top: 25, right: 30, bottom: 40, left: 65 };
  const dPlotW = dWidth - dPadding.left - dPadding.right;
  const dPlotH = dHeight - dPadding.top - dPadding.bottom;

  const dX = (age: number) => dPadding.left + (age / 10) * dPlotW;
  const dY = (price: number) => {
    const range = maxDeprecPrice - minDeprecPrice || 1;
    return dPadding.top + dPlotH - ((price - minDeprecPrice) / range) * dPlotH;
  };

  const dSvgPath = useMemo(() => {
    return depreciationCurve.reduce((acc, pt, idx) => {
      const cmd = idx === 0 ? 'M' : 'L';
      return `${acc} ${cmd} ${dX(pt.age).toFixed(1)} ${dY(pt.price).toFixed(1)}`;
    }, '');
  }, [depreciationCurve, maxDeprecPrice, minDeprecPrice]);

  const dAreaPath = useMemo(() => {
    if (depreciationCurve.length === 0) return '';
    const firstX = dX(depreciationCurve[0].age).toFixed(1);
    const lastX = dX(depreciationCurve[depreciationCurve.length - 1].age).toFixed(1);
    const baseY = (dPadding.top + dPlotH).toFixed(1);
    return `${dSvgPath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }, [dSvgPath]);

  // SVG dimensions for Regression scatter graph
  const sWidth = 560;
  const sHeight = 260;
  const sPadding = { top: 25, right: 30, bottom: 45, left: 65 };
  const sPlotW = sWidth - sPadding.left - sPadding.right;
  const sPlotH = sHeight - sPadding.top - sPadding.bottom;
  const maxRegPrice = 110000;

  const sX = (actual: number) => sPadding.left + (Math.min(actual, maxRegPrice) / maxRegPrice) * sPlotW;
  const sY = (pred: number) => sPadding.top + sPlotH - (Math.min(pred, maxRegPrice) / maxRegPrice) * sPlotH;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 sm:p-5 space-y-4">
      {/* Header and sub-tab selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-[#0D2B5E] flex items-center gap-2">
            <span>Prediction Graph</span>
          </h2>
          <p className="text-xs text-slate-500">
            Visual model analysis: depreciation trajectory & regression accuracy
          </p>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-medium text-slate-600 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('depreciation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'depreciation'
                ? 'bg-white text-[#0D2B5E] shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Depreciation (0–10 Yrs)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('regression')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'regression'
                ? 'bg-white text-[#0D2B5E] shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            <ScatterChart className="w-3.5 h-3.5" />
            <span>Actual vs. Predicted</span>
          </button>
        </div>
      </div>

      {activeTab === 'depreciation' ? (
        /* DEPRECIATION CURVE */
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2 bg-[#F4F7FC]/70 p-2.5 rounded-lg border border-slate-200/50">
            <div>
              <span className="font-semibold text-[#0D2B5E]">{currentSelection.brand}</span> •{' '}
              {currentSelection.processor} • {currentSelection.ram} • {currentSelection.storage} (
              {currentSelection.storage_type})
            </div>
            {currentPrice !== null && (
              <div className="text-right">
                Current ({currentAge} yr{currentAge === 1 ? '' : 's'}):{' '}
                <span className="font-bold text-[#1E5AA8]">₹ {formatRupee(currentPrice)}</span>
              </div>
            )}
          </div>

          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${dWidth} ${dHeight}`}
              className="w-full h-auto min-w-[320px] max-h-[250px] select-none"
            >
              <defs>
                <linearGradient id="deprecGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E5AA8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#1E5AA8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const yVal = dPadding.top + dPlotH * pct;
                const priceVal = Math.round(maxDeprecPrice - pct * (maxDeprecPrice - minDeprecPrice));
                return (
                  <g key={i}>
                    <line
                      x1={dPadding.left}
                      y1={yVal}
                      x2={dPadding.left + dPlotW}
                      y2={yVal}
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={dPadding.left - 8}
                      y={yVal + 3.5}
                      textAnchor="end"
                      fontSize="9"
                      fill="#64748B"
                    >
                      ₹{Math.round(priceVal / 1000)}k
                    </text>
                  </g>
                );
              })}

              {/* X axis lines and labels */}
              {[0, 2, 4, 6, 8, 10].map((age) => {
                const xVal = dX(age);
                return (
                  <g key={age}>
                    <line
                      x1={xVal}
                      y1={dPadding.top}
                      x2={xVal}
                      y2={dPadding.top + dPlotH}
                      stroke="#F1F5F9"
                    />
                    <text
                      x={xVal}
                      y={dPadding.top + dPlotH + 18}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#64748B"
                    >
                      {age} {age === 0 ? '(New)' : 'yr'}
                    </text>
                  </g>
                );
              })}

              {/* X-axis title */}
              <text
                x={dPadding.left + dPlotW / 2}
                y={dHeight - 5}
                textAnchor="middle"
                fontSize="10"
                fill="#475569"
                fontWeight="500"
              >
                Laptop Age (Years)
              </text>

              {/* Area fill */}
              <path d={dAreaPath} fill="url(#deprecGradient)" />

              {/* Main curve */}
              <path
                d={dSvgPath}
                fill="none"
                stroke="#1E5AA8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {depreciationCurve.map((pt) => {
                const cx = dX(pt.age);
                const cy = dY(pt.price);
                const isSelected = pt.age === currentAge;
                const isHovered = hoveredPoint?.age === pt.age;

                return (
                  <g
                    key={pt.age}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="9"
                        fill="#0D2B5E"
                        fillOpacity="0.2"
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 6 : isHovered ? 5 : 3.5}
                      fill={isSelected ? '#0D2B5E' : '#1E5AA8'}
                      stroke="#FFFFFF"
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                  </g>
                );
              })}

              {/* Tooltip on SVG if hovered or selected */}
              {(hoveredPoint || currentPrice !== null) && (
                (() => {
                  const target = hoveredPoint || {
                    age: currentAge,
                    price: currentPrice || 0,
                    deprecPct: depreciationCurve[currentAge]?.deprecPct || 0,
                  };
                  const tx = dX(target.age);
                  const ty = dY(target.price);
                  const tooltipWidth = 120;
                  const flipX = tx + tooltipWidth > dWidth - 10;
                  const rx = flipX ? tx - tooltipWidth - 8 : tx + 8;
                  const ry = Math.max(dPadding.top + 5, Math.min(ty - 35, dHeight - 65));

                  return (
                    <g pointerEvents="none">
                      <rect
                        x={rx}
                        y={ry}
                        width={tooltipWidth}
                        height="40"
                        rx="6"
                        fill="#0D2B5E"
                        opacity="0.95"
                      />
                      <text x={rx + 8} y={ry + 15} fontSize="10" fill="#BFD3F2">
                        {target.age === 0 ? 'Brand New' : `Year ${target.age} (${target.deprecPct}% off)`}
                      </text>
                      <text
                        x={rx + 8}
                        y={ry + 30}
                        fontSize="12"
                        fontWeight="bold"
                        fill="#FFFFFF"
                      >
                        ₹ {formatRupee(target.price)}
                      </text>
                    </g>
                  );
                })()
              )}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0D2B5E] inline-block ring-2 ring-[#0D2B5E]/30"></span>
              Large dot indicates your selected age ({currentAge} yr{currentAge === 1 ? '' : 's'})
            </span>
            <span>Hover points to view valuation by year</span>
          </div>
        </div>
      ) : (
        /* REGRESSION PLOT: ACTUAL VS PREDICTED */
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2 bg-[#F4F7FC]/70 p-2.5 rounded-lg border border-slate-200/50">
            <div className="flex items-center gap-3">
              <span>
                Holdout <span className="font-semibold text-slate-800">R² = {MODEL_METRICS.testR2}</span>
              </span>
              <span>•</span>
              <span>
                Mean Absolute Error: <span className="font-semibold text-slate-800">₹{formatRupee(MODEL_METRICS.testMae)}</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Ideal Fit Line: <span className="text-[#1E5AA8] font-semibold">y = x</span>
            </div>
          </div>

          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${sWidth} ${sHeight}`}
              className="w-full h-auto min-w-[320px] max-h-[260px] select-none"
            >
              {/* Grid lines */}
              {[20000, 40000, 60000, 80000, 100000].map((val) => {
                const yVal = sY(val);
                const xVal = sX(val);
                return (
                  <g key={val}>
                    <line
                      x1={sPadding.left}
                      y1={yVal}
                      x2={sPadding.left + sPlotW}
                      y2={yVal}
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1={xVal}
                      y1={sPadding.top}
                      x2={xVal}
                      y2={sPadding.top + sPlotH}
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={sPadding.left - 6}
                      y={yVal + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="#64748B"
                    >
                      ₹{val / 1000}k
                    </text>
                    <text
                      x={xVal}
                      y={sPadding.top + sPlotH + 15}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#64748B"
                    >
                      ₹{val / 1000}k
                    </text>
                  </g>
                );
              })}

              {/* Parity Line (Ideal 45 degree line: Predicted = Actual) */}
              <line
                x1={sX(0)}
                y1={sY(0)}
                x2={sX(maxRegPrice)}
                y2={sY(maxRegPrice)}
                stroke="#1E5AA8"
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />

              {/* Scatter Points */}
              {TEST_SAMPLE_POINTS.map((pt, idx) => {
                const cx = sX(pt.actual);
                const cy = sY(pt.predicted);
                return (
                  <circle
                    key={idx}
                    cx={cx}
                    cy={cy}
                    r="3"
                    fill="#3B82F6"
                    fillOpacity="0.65"
                    stroke="#1E3A8A"
                    strokeWidth="0.5"
                  >
                    <title>{`${pt.brand} ${pt.processor} (${pt.age} yrs)\nActual: ₹${formatRupee(pt.actual)}\nPredicted: ₹${formatRupee(pt.predicted)}`}</title>
                  </circle>
                );
              })}

              {/* User Current Prediction Point (if available) */}
              {currentPrice !== null && (
                <g>
                  {/* Mark on parity line */}
                  <circle
                    cx={sX(currentPrice)}
                    cy={sY(currentPrice)}
                    r="7"
                    fill="#10B981"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="drop-shadow-sm"
                  />
                  <text
                    x={sX(currentPrice) + 9}
                    y={sY(currentPrice) - 4}
                    fontSize="10"
                    fontWeight="bold"
                    fill="#0D2B5E"
                  >
                    Your Prediction
                  </text>
                </g>
              )}

              {/* Axis Titles */}
              <text
                x={sPadding.left + sPlotW / 2}
                y={sHeight - 6}
                textAnchor="middle"
                fontSize="10"
                fill="#475569"
                fontWeight="500"
              >
                Actual Resale Price (₹ INR)
              </text>
              <text
                transform={`rotate(-90 ${15} ${sPadding.top + sPlotH / 2})`}
                x={15}
                y={sPadding.top + sPlotH / 2}
                textAnchor="middle"
                fontSize="10"
                fill="#475569"
                fontWeight="500"
              >
                Predicted Price (₹ INR)
              </text>
            </svg>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Points close to the dashed line indicate high accuracy. 120 holdout test laptops evaluated against the 30-tree ensemble.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
