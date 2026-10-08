import { describe, expect, it } from 'vitest';
import { NEUTRAL_COLOR, NO_DATA_COLOR, changeToColor } from './color';

const rgb = (s: string) => s.match(/\d+/g)!.map(Number) as [number, number, number];

describe('changeToColor', () => {
  it('マイナスは赤系、プラスは緑系', () => {
    const [r1, g1] = rgb(changeToColor(-2, '24h'));
    expect(r1).toBeGreaterThan(g1);
    const [r2, g2] = rgb(changeToColor(2, '24h'));
    expect(g2).toBeGreaterThan(r2);
  });

  it('ほぼ横ばいはグレー、欠損はデータなし色', () => {
    expect(changeToColor(0.001, '24h')).toBe(NEUTRAL_COLOR);
    expect(changeToColor(null, '24h')).toBe(NO_DATA_COLOR);
  });

  it('閾値を超えると同じ色に飽和する', () => {
    expect(changeToColor(-10, '24h')).toBe(changeToColor(-50, '24h'));
  });
});
