import type { PeriodId } from '../markets/types';

/**
 * 騰落率 → タイル背景色。
 * マイナスは赤系、プラスは緑系。変動が大きいほど彩度の高い色になる。
 * 期間が長いほど値動きが大きくなるため、色が飽和する閾値を期間ごとに変える。
 */

/** この値（%）以上の変動で色が最も濃くなる */
export const SATURATION_THRESHOLD: Record<PeriodId, number> = {
  '1h': 1,
  '24h': 5,
  '7d': 10,
  '30d': 20,
  '1y': 50,
};

/** |騰落率| がこの値（%）未満なら横ばいとしてグレーにする（ステーブルコイン等） */
export const NEUTRAL_EPSILON = 0.02;

export const NEUTRAL_COLOR = '#7a8394';
export const NO_DATA_COLOR = '#3a4150';

type Rgb = [number, number, number];

// [弱, 強]
const NEGATIVE: [Rgb, Rgb] = [
  [0x8a, 0x2c, 0x33],
  [0xe0, 0x18, 0x24],
];
const POSITIVE: [Rgb, Rgb] = [
  [0x1f, 0x6b, 0x4b],
  [0x10, 0xc8, 0x7e],
];

function mix(a: Rgb, b: Rgb, t: number): string {
  const c = a.map((v, i) => Math.round(v + (b[i]! - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function changeToColor(change: number | null | undefined, period: PeriodId): string {
  if (change == null || !Number.isFinite(change)) return NO_DATA_COLOR;
  if (Math.abs(change) < NEUTRAL_EPSILON) return NEUTRAL_COLOR;
  const t = Math.min(Math.abs(change) / SATURATION_THRESHOLD[period], 1);
  // 平方根で弱い変動でも色の差が出やすくする
  const eased = Math.sqrt(t);
  const [weak, strong] = change < 0 ? NEGATIVE : POSITIVE;
  return mix(weak, strong, eased);
}
