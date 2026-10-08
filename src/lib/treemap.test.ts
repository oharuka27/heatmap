import { describe, expect, it } from 'vitest';
import { squarify } from './treemap';

const bounds = { x: 0, y: 0, width: 800, height: 500 };
const EPS = 1e-6;

describe('squarify', () => {
  const values = [500, 120, 60, 40, 30, 20, 10, 8, 5, 3, 1, 1];
  const nodes = squarify(values, (v) => v, bounds);
  const total = values.reduce((a, b) => a + b, 0);

  it('全要素を配置する', () => {
    expect(nodes).toHaveLength(values.length);
  });

  it('面積が値に比例する', () => {
    for (const n of nodes) {
      const expected = (n.item / total) * bounds.width * bounds.height;
      expect(n.width * n.height).toBeCloseTo(expected, 3);
    }
  });

  it('領域内に収まり、重ならない', () => {
    for (const n of nodes) {
      expect(n.x).toBeGreaterThanOrEqual(-EPS);
      expect(n.y).toBeGreaterThanOrEqual(-EPS);
      expect(n.x + n.width).toBeLessThanOrEqual(bounds.width + EPS);
      expect(n.y + n.height).toBeLessThanOrEqual(bounds.height + EPS);
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        expect(ox <= EPS || oy <= EPS).toBe(true);
      }
    }
  });

  it('0 以下・非数の値は除外する', () => {
    expect(squarify([10, 0, -5, NaN], (v) => v, bounds)).toHaveLength(1);
  });

  it('領域サイズが 0 なら空配列', () => {
    expect(squarify([1, 2], (v) => v, { x: 0, y: 0, width: 0, height: 100 })).toEqual([]);
  });
});
