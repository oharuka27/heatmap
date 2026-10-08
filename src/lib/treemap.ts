/**
 * Squarified Treemap レイアウト
 * (Bruls, Huizing, van Wijk "Squarified Treemaps", 2000)
 *
 * 各タイルのアスペクト比をできるだけ 1 に近づけながら、値に比例した面積で矩形を敷き詰める。
 * DOM / React に依存しない純粋関数にしてあり、単体テスト可能。
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type LayoutNode<T> = Rect & { item: T };

/** 行に面積合計 sum の矩形群を短辺 side に沿って並べたときの最悪アスペクト比 */
function worstRatio(min: number, max: number, sum: number, side: number): number {
  const s2 = side * side;
  const sum2 = sum * sum;
  return Math.max((s2 * max) / sum2, sum2 / (s2 * min));
}

export function squarify<T>(items: readonly T[], getValue: (item: T) => number, bounds: Rect): LayoutNode<T>[] {
  const entries = items
    .map((item) => ({ item, value: getValue(item) }))
    .filter((e) => Number.isFinite(e.value) && e.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = entries.reduce((acc, e) => acc + e.value, 0);
  if (total <= 0 || bounds.width <= 0 || bounds.height <= 0) return [];

  const scale = (bounds.width * bounds.height) / total;
  const areas = entries.map((e) => e.value * scale);
  const result: LayoutNode<T>[] = [];

  let { x, y, width, height } = bounds;
  let start = 0;

  while (start < areas.length) {
    const side = Math.min(width, height);

    // 行に追加してもアスペクト比が悪化しない限り詰め込む
    let end = start + 1;
    let rowSum = areas[start]!;
    let rowMin = rowSum;
    let rowMax = rowSum;
    let current = worstRatio(rowMin, rowMax, rowSum, side);

    while (end < areas.length) {
      const a = areas[end]!;
      const next = worstRatio(Math.min(rowMin, a), Math.max(rowMax, a), rowSum + a, side);
      if (next > current) break;
      rowSum += a;
      rowMin = Math.min(rowMin, a);
      rowMax = Math.max(rowMax, a);
      current = next;
      end++;
    }

    const isLast = end >= areas.length;
    // 残り領域の短辺方向に沿って 1 行（1 列）を確定する
    const thickness = isLast ? (width >= height ? width : height) : rowSum / side;

    if (width >= height) {
      // 左端に縦の列を置く
      let cy = y;
      for (let i = start; i < end; i++) {
        const h = i === end - 1 ? y + height - cy : areas[i]! / thickness;
        result.push({ item: entries[i]!.item, x, y: cy, width: thickness, height: h });
        cy += h;
      }
      x += thickness;
      width -= thickness;
    } else {
      // 上端に横の行を置く
      let cx = x;
      for (let i = start; i < end; i++) {
        const w = i === end - 1 ? x + width - cx : areas[i]! / thickness;
        result.push({ item: entries[i]!.item, x: cx, y, width: w, height: thickness });
        cx += w;
      }
      y += thickness;
      height -= thickness;
    }

    start = end;
  }

  return result;
}
