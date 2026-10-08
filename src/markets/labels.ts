import type { CurrencyCode, PeriodId, SizeMetric } from './types';

export const PERIOD_LABELS: Record<PeriodId, string> = {
  '1h': '過去1時間',
  '24h': '過去24時間',
  '7d': '過去7日間',
  '30d': '過去30日間',
  '1y': '過去1年間',
};

export const SIZE_METRIC_LABELS: Record<SizeMetric, string> = {
  marketCap: '時価総額',
  volume: '取引高(24h)',
};

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  jpy: 'JPY (¥)',
  usd: 'USD ($)',
};
