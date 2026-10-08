/**
 * マーケット共通のドメイン型。
 * 仮想通貨・日本株・米国株のいずれもこの型に正規化してから UI に渡す。
 * UI 側は「どのマーケットか」を意識せずに描画できるようにする。
 */

export type MarketId = 'crypto' | 'jp-stock' | 'us-stock';

/** 騰落率の集計期間。マーケットごとに対応する期間は MarketDefinition.periods で宣言する。 */
export type PeriodId = '1h' | '24h' | '7d' | '30d' | '1y';

export type CurrencyCode = 'jpy' | 'usd';

/** タイル面積の基準となる指標 */
export type SizeMetric = 'marketCap' | 'volume';

export interface Asset {
  /** マーケット内で一意な ID（CoinGecko の coin id、証券コード、ティッカー等） */
  id: string;
  /** タイルに大きく表示する短い名前（BTC, 7203, AAPL 等） */
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume: number;
  /** 期間ごとの騰落率（%）。データが無い期間は null */
  changes: Partial<Record<PeriodId, number | null>>;
  imageUrl?: string;
}

export interface MarketSnapshot {
  assets: Asset[];
  /** マーケット全体の時価総額（シェア計算用）。取得できない場合は表示銘柄の合計で代替する */
  totalMarketCap?: number;
  fetchedAt: number;
}

export interface FetchParams {
  currency: CurrencyCode;
  limit: number;
  signal?: AbortSignal;
}

/** データ取得の実装。マーケットごとに 1 つ用意する */
export interface MarketProvider {
  fetchSnapshot(params: FetchParams): Promise<MarketSnapshot>;
}

export interface MarketDefinition {
  id: MarketId;
  /** タブに表示するラベル */
  label: string;
  /** provider が無いマーケットは「準備中」としてタブを無効化する */
  provider?: MarketProvider;
  /** true のマーケットはタブ自体を表示しない（URL で指定されても選択させない） */
  hidden?: boolean;
  periods: PeriodId[];
  defaultPeriod: PeriodId;
  currencies: CurrencyCode[];
  defaultCurrency: CurrencyCode;
  sizeMetrics: SizeMetric[];
  /** 表示件数（上位 N 件で打ち切り）の選択肢。1 つだけならプルダウンを出さず固定表示にする */
  limits: number[];
  defaultLimit: number;
  /** 全体に占める割合の呼び名（仮想通貨: Dominance、株: 構成比 など） */
  shareLabel: string;
  /** 自動更新間隔（ms） */
  refreshIntervalMs: number;
  /** 手動再読み込みを許可するまでの最小間隔（ms）。API のレート制限対策 */
  minReloadIntervalMs: number;
}
