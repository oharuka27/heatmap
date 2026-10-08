import { useEffect, useState } from 'react';
import type { ViewSettings } from '../hooks/useViewSettings';
import { CURRENCY_LABELS, PERIOD_LABELS, SIZE_METRIC_LABELS } from '../markets/labels';
import type { MarketDefinition } from '../markets/types';
import { Select } from './Select';

interface Props {
  market: MarketDefinition;
  settings: ViewSettings;
  onChange: (patch: Partial<ViewSettings>) => void;
  loading: boolean;
  fetchedAt: number | null;
  onReload: () => void;
}

/** 前回取得から minReloadIntervalMs 経つまでの残り秒数（0 なら再読み込み可） */
function useReloadCooldown(fetchedAt: number | null, intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  const readyAt = fetchedAt === null ? 0 : fetchedAt + intervalMs;
  // 取得直後は now が古いままなので上限を intervalMs で抑える
  const remaining = Math.min(Math.max(0, Math.ceil((readyAt - now) / 1000)), Math.ceil(intervalMs / 1000));
  const coolingDown = remaining > 0;

  useEffect(() => {
    if (!coolingDown) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [coolingDown, readyAt]);

  return remaining;
}

export function Toolbar({ market, settings, onChange, loading, fetchedAt, onReload }: Props) {
  const cooldown = useReloadCooldown(fetchedAt, market.minReloadIntervalMs);

  return (
    <div className="toolbar">
      <span className="rank-badge">
        時価総額 <strong>上位{settings.limit}位</strong>
      </span>
      <Select
        label="期間"
        value={settings.period}
        options={market.periods.map((p) => ({ value: p, label: PERIOD_LABELS[p] }))}
        onChange={(period) => onChange({ period })}
      />
      <Select
        label="サイズ"
        value={settings.sizeMetric}
        options={market.sizeMetrics.map((s) => ({ value: s, label: SIZE_METRIC_LABELS[s] }))}
        onChange={(sizeMetric) => onChange({ sizeMetric })}
      />
      {market.limits.length > 1 && (
        <Select
          label="表示件数"
          value={settings.limit}
          options={market.limits.map((n) => ({ value: n, label: `上位 ${n}` }))}
          onChange={(limit) => onChange({ limit })}
        />
      )}
      {market.currencies.length > 1 && (
        <Select
          label="通貨"
          value={settings.currency}
          options={market.currencies.map((c) => ({ value: c, label: CURRENCY_LABELS[c] }))}
          onChange={(currency) => onChange({ currency })}
        />
      )}
      <div className="toolbar-spacer" />
      <div className="reload">
        <div className="reload-row">
          <span className="updated-at">
            {loading ? '更新中…' : fetchedAt ? `更新: ${new Date(fetchedAt).toLocaleTimeString('ja-JP')}` : ''}
          </span>
          <button type="button" className="button" onClick={onReload} disabled={loading || cooldown > 0}>
            {cooldown > 0 ? `再読み込み (${cooldown}秒)` : '再読み込み'}
          </button>
        </div>
        <p className="reload-note">
          ※ API の利用制限のため、再読み込みは 1 分ほど間隔を空けてください。
          <br />
          制限にかかった場合は 10 分ほど待ってからお試しください。
        </p>
      </div>
    </div>
  );
}
