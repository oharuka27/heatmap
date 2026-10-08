import { SATURATION_THRESHOLD, changeToColor } from '../lib/color';
import type { PeriodId } from '../markets/types';

export function Legend({ period }: { period: PeriodId }) {
  const max = SATURATION_THRESHOLD[period];
  const steps = [-1, -0.5, -0.2, 0, 0.2, 0.5, 1].map((r) => r * max);
  return (
    <div className="legend" aria-label="凡例">
      {steps.map((v) => (
        <span key={v} className="legend-cell" style={{ background: changeToColor(v, period) }}>
          {v > 0 ? '+' : ''}
          {Number.isInteger(v) ? v : v.toFixed(1)}%
        </span>
      ))}
    </div>
  );
}
