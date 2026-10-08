import { coinGeckoProvider } from './crypto/coingecko';
import type { MarketDefinition, MarketId } from './types';

/**
 * マーケット一覧。タブはこの配列の順に表示される。
 * 新しいマーケットを追加するときは provider を実装してここに登録するだけでよい。
 */
export const MARKETS: MarketDefinition[] = [
  {
    id: 'crypto',
    label: '仮想通貨',
    provider: coinGeckoProvider,
    periods: ['1h', '24h', '7d', '30d', '1y'],
    defaultPeriod: '24h',
    currencies: ['jpy', 'usd'],
    defaultCurrency: 'jpy',
    sizeMetrics: ['marketCap', 'volume'],
    limits: [50, 100, 150, 250],
    defaultLimit: 100,
    shareLabel: 'Dominance',
    refreshIntervalMs: 60_000,
  },
  {
    id: 'jp-stock',
    label: '日本株',
    // TODO: provider 未実装（README の「今後の予定」参照）
    periods: ['24h', '7d', '30d', '1y'],
    defaultPeriod: '24h',
    currencies: ['jpy'],
    defaultCurrency: 'jpy',
    sizeMetrics: ['marketCap', 'volume'],
    limits: [100, 225],
    defaultLimit: 100,
    shareLabel: '構成比',
    refreshIntervalMs: 60_000,
  },
  {
    id: 'us-stock',
    label: '米国株',
    // TODO: provider 未実装（README の「今後の予定」参照）
    periods: ['24h', '7d', '30d', '1y'],
    defaultPeriod: '24h',
    currencies: ['usd'],
    defaultCurrency: 'usd',
    sizeMetrics: ['marketCap', 'volume'],
    limits: [100, 500],
    defaultLimit: 100,
    shareLabel: '構成比',
    refreshIntervalMs: 60_000,
  },
];

export const DEFAULT_MARKET_ID: MarketId = 'crypto';

export function getMarket(id: MarketId): MarketDefinition {
  const market = MARKETS.find((m) => m.id === id);
  if (!market) throw new Error(`Unknown market: ${id}`);
  return market;
}

export function isMarketAvailable(market: MarketDefinition): boolean {
  return market.provider !== undefined;
}
