import { useCallback, useEffect, useRef, useState } from 'react';
import type { CurrencyCode, MarketDefinition, MarketSnapshot } from '../markets/types';

interface State {
  /** この state がどの取得条件のものか */
  key: string;
  snapshot: MarketSnapshot | null;
  error: string | null;
  loading: boolean;
}

/** タブや通貨を行き来したときに無駄に API を叩かないための簡易キャッシュ */
const cache = new Map<string, MarketSnapshot>();
const CACHE_TTL_MS = 30_000;

/**
 * マーケットのスナップショットを取得し、refreshIntervalMs ごとに自動更新する。
 * 期間（1h / 24h …）の切替は取得済みデータの参照先を変えるだけなので、この hook の引数に含めない。
 */
export function useMarketData(market: MarketDefinition, currency: CurrencyCode, limit: number) {
  const key = `${market.id}:${currency}:${limit}`;
  const [state, setState] = useState<State>(() => ({
    key,
    snapshot: cache.get(key) ?? null,
    error: null,
    loading: false,
  }));
  const [reloadToken, setReloadToken] = useState(0);
  const forceRef = useRef(false);

  const reload = useCallback(() => {
    forceRef.current = true;
    setReloadToken((n) => n + 1);
  }, []);

  useEffect(() => {
    const provider = market.provider;
    if (!provider) {
      setState({ key, snapshot: null, error: null, loading: false });
      return;
    }

    let controller: AbortController | null = null;

    const load = async (force: boolean) => {
      const cached = cache.get(key);
      if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        setState({ key, snapshot: cached, error: null, loading: false });
        return;
      }
      controller?.abort();
      controller = new AbortController();
      // 同じ条件の既存データは残したまま loading にする（更新中にヒートマップが消えないように）
      setState((s) => ({
        key,
        snapshot: s.key === key ? s.snapshot : (cached ?? null),
        error: null,
        loading: true,
      }));
      try {
        const snapshot = await provider.fetchSnapshot({ currency, limit, signal: controller.signal });
        cache.set(key, snapshot);
        setState({ key, snapshot, error: null, loading: false });
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setState((s) => ({ ...s, error: e instanceof Error ? e.message : String(e), loading: false }));
      }
    };

    void load(forceRef.current);
    forceRef.current = false;

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load(true);
    }, market.refreshIntervalMs);

    return () => {
      window.clearInterval(timer);
      controller?.abort();
    };
  }, [key, market, currency, limit, reloadToken]);

  // 条件が変わった直後（effect 実行前）のレンダーでは古い条件のデータを見せない
  if (state.key !== key) {
    return { snapshot: cache.get(key) ?? null, error: null, loading: true, reload };
  }
  return { snapshot: state.snapshot, error: state.error, loading: state.loading, reload };
}
