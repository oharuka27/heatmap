import type { Asset, FetchParams, MarketProvider, MarketSnapshot, PeriodId } from '../types';

const API_BASE = 'https://api.coingecko.com/api/v3';

/** CoinGecko /coins/markets のレスポンスのうち利用するフィールド */
interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price: number | null;
  market_cap: number | null;
  total_volume: number | null;
  price_change_percentage_1h_in_currency?: number | null;
  price_change_percentage_24h_in_currency?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  price_change_percentage_30d_in_currency?: number | null;
  price_change_percentage_1y_in_currency?: number | null;
}

interface CoinGeckoGlobal {
  data?: { total_market_cap?: Record<string, number> };
}

/** CoinGecko の per_page 上限 */
const MAX_PER_PAGE = 250;

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal, headers: { accept: 'application/json' } });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    // 無料 API はレート制限時のレスポンスに CORS ヘッダーが付かず、ブラウザからは単なる通信失敗に見える
    throw new Error('CoinGecko に接続できませんでした（レート制限の可能性があります）。1 分ほど待って再試行してください。');
  }
  if (res.status === 429) {
    throw new Error('CoinGecko のレート制限に達しました。少し時間をおいて再試行してください。');
  }
  if (!res.ok) {
    throw new Error(`CoinGecko API エラー (HTTP ${res.status})`);
  }
  return (await res.json()) as T;
}

function toAsset(m: CoinGeckoMarket): Asset {
  const changes: Partial<Record<PeriodId, number | null>> = {
    '1h': m.price_change_percentage_1h_in_currency ?? null,
    '24h': m.price_change_percentage_24h_in_currency ?? null,
    '7d': m.price_change_percentage_7d_in_currency ?? null,
    '30d': m.price_change_percentage_30d_in_currency ?? null,
    '1y': m.price_change_percentage_1y_in_currency ?? null,
  };
  return {
    id: m.id,
    symbol: m.symbol.toUpperCase(),
    name: m.name,
    price: m.current_price ?? 0,
    marketCap: m.market_cap ?? 0,
    volume: m.total_volume ?? 0,
    changes,
    imageUrl: m.image,
  };
}

export const coinGeckoProvider: MarketProvider = {
  async fetchSnapshot({ currency, limit, signal }: FetchParams): Promise<MarketSnapshot> {
    const params = new URLSearchParams({
      vs_currency: currency,
      order: 'market_cap_desc',
      per_page: String(Math.min(limit, MAX_PER_PAGE)),
      page: '1',
      price_change_percentage: '1h,24h,7d,30d,1y',
    });

    // 期間別の騰落率は 1 リクエストでまとめて取得できるため、期間切替時の再取得は不要
    const [markets, global] = await Promise.all([
      getJson<CoinGeckoMarket[]>(`${API_BASE}/coins/markets?${params}`, signal),
      // Dominance 用の全体時価総額。失敗しても表示銘柄の合計で代替できるので握りつぶす
      getJson<CoinGeckoGlobal>(`${API_BASE}/global`, signal).catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') throw e;
        return undefined;
      }),
    ]);

    return {
      assets: markets.map(toAsset),
      totalMarketCap: global?.data?.total_market_cap?.[currency],
      fetchedAt: Date.now(),
    };
  },
};
