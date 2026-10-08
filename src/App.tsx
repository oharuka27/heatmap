import { Heatmap } from './components/Heatmap';
import { Legend } from './components/Legend';
import { MarketTabs } from './components/MarketTabs';
import { Toolbar } from './components/Toolbar';
import { useMarketData } from './hooks/useMarketData';
import { useViewSettings } from './hooks/useViewSettings';
import { getMarket } from './markets/registry';

export function App() {
  const [settings, update] = useViewSettings();
  const market = getMarket(settings.market);
  const { snapshot, error, loading, reload } = useMarketData(market, settings.currency, settings.limit);

  return (
    <div className="app">
      <header className="header">
        <h1>マーケットヒートマップ</h1>
        <p className="subtitle">
          タイルの大きさは{settings.sizeMetric === 'marketCap' ? '時価総額' : '取引高'}、色は騰落率（赤: 下落 / 緑: 上昇）を表します。
        </p>
      </header>

      <MarketTabs value={settings.market} onChange={(id) => update({ market: id })} />

      <Toolbar
        market={market}
        settings={settings}
        onChange={update}
        loading={loading}
        fetchedAt={snapshot?.fetchedAt ?? null}
        onReload={reload}
      />

      {error && (
        <div className="error" role="alert">
          {error}
          <button type="button" className="button" onClick={reload}>
            再試行
          </button>
        </div>
      )}

      <main className="heatmap-frame">
        {snapshot ? (
          <Heatmap
            snapshot={snapshot}
            period={settings.period}
            sizeMetric={settings.sizeMetric}
            currency={settings.currency}
            limit={settings.limit}
            shareLabel={market.shareLabel}
          />
        ) : (
          <div className="placeholder">{error ? 'データを取得できませんでした' : '読み込み中…'}</div>
        )}
      </main>

      <footer className="footer">
        <Legend period={settings.period} />
        {market.id === 'crypto' && (
          <span className="credit">
            Data provided by{' '}
            <a href="https://www.coingecko.com/" target="_blank" rel="noreferrer">
              CoinGecko
            </a>
          </span>
        )}
      </footer>
    </div>
  );
}
