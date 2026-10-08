import type { CurrencyCode } from '../markets/types';

const CURRENCY_SYMBOL: Record<CurrencyCode, string> = { jpy: '¥', usd: '$' };

export function formatPrice(value: number, currency: CurrencyCode): string {
  const abs = Math.abs(value);
  const options: Intl.NumberFormatOptions =
    abs >= 1
      ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : // 1 未満の銘柄は有効数字で表示（例: ¥0.001234）
        { maximumSignificantDigits: 4 };
  return CURRENCY_SYMBOL[currency] + value.toLocaleString('en-US', options);
}

export function formatCompact(value: number, currency: CurrencyCode): string {
  return (
    CURRENCY_SYMBOL[currency] +
    value.toLocaleString('ja-JP', { notation: 'compact', maximumFractionDigits: 2 })
  );
}

export function formatChange(change: number | null | undefined): string {
  if (change == null || !Number.isFinite(change)) return '—';
  return `${Math.abs(change).toFixed(2)}%`;
}

export function changeArrow(change: number | null | undefined): string {
  if (change == null || !Number.isFinite(change) || change === 0) return '';
  return change > 0 ? '▲' : '▼';
}

export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`;
}
