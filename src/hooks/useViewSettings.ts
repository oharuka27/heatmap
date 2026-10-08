import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_MARKET_ID, VISIBLE_MARKETS, getMarket } from '../markets/registry';
import type { CurrencyCode, MarketDefinition, MarketId, PeriodId, SizeMetric } from '../markets/types';

export interface ViewSettings {
  market: MarketId;
  period: PeriodId;
  currency: CurrencyCode;
  sizeMetric: SizeMetric;
  limit: number;
}

function defaultsFor(market: MarketDefinition): ViewSettings {
  return {
    market: market.id,
    period: market.defaultPeriod,
    currency: market.defaultCurrency,
    sizeMetric: market.sizeMetrics[0]!,
    limit: market.defaultLimit,
  };
}

/** URL の値がそのマーケットで有効でなければデフォルトに戻す */
function sanitize(raw: Partial<Record<keyof ViewSettings, string | null>>): ViewSettings {
  const market = VISIBLE_MARKETS.find((m) => m.id === raw.market) ?? getMarket(DEFAULT_MARKET_ID);
  const d = defaultsFor(market);
  const limit = Number(raw.limit);
  return {
    market: market.id,
    period: market.periods.find((p) => p === raw.period) ?? d.period,
    currency: market.currencies.find((c) => c === raw.currency) ?? d.currency,
    sizeMetric: market.sizeMetrics.find((s) => s === raw.sizeMetric) ?? d.sizeMetric,
    limit: market.limits.includes(limit) ? limit : d.limit,
  };
}

function readFromUrl(): ViewSettings {
  const q = new URLSearchParams(window.location.search);
  return sanitize({
    market: q.get('market'),
    period: q.get('period'),
    currency: q.get('currency'),
    sizeMetric: q.get('size'),
    limit: q.get('limit'),
  });
}

function writeToUrl(s: ViewSettings) {
  const q = new URLSearchParams({
    market: s.market,
    period: s.period,
    currency: s.currency,
    size: s.sizeMetric,
    limit: String(s.limit),
  });
  window.history.replaceState(null, '', `${window.location.pathname}?${q}`);
}

/**
 * 表示設定（マーケット・期間・通貨など）を URL クエリと同期して保持する。
 * URL を共有すれば同じ表示を再現できる。
 */
export function useViewSettings() {
  const [settings, setSettings] = useState<ViewSettings>(readFromUrl);

  useEffect(() => writeToUrl(settings), [settings]);

  const update = useCallback((patch: Partial<ViewSettings>) => {
    setSettings((prev) => {
      if (patch.market && patch.market !== prev.market) {
        // マーケットを切り替えたら、そのマーケットで有効な値に揃える
        return sanitize({ ...prev, ...patch, limit: String(patch.limit ?? prev.limit) });
      }
      return { ...prev, ...patch };
    });
  }, []);

  return [settings, update] as const;
}
