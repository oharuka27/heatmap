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

export function Toolbar({ market, settings, onChange, loading, fetchedAt, onReload }: Props) {
  return (
    <div className="toolbar">
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
      <Select
        label="表示件数"
        value={settings.limit}
        options={market.limits.map((n) => ({ value: n, label: `上位 ${n}` }))}
        onChange={(limit) => onChange({ limit })}
      />
      {market.currencies.length > 1 && (
        <Select
          label="通貨"
          value={settings.currency}
          options={market.currencies.map((c) => ({ value: c, label: CURRENCY_LABELS[c] }))}
          onChange={(currency) => onChange({ currency })}
        />
      )}
      <div className="toolbar-spacer" />
      <span className="updated-at">
        {loading ? '更新中…' : fetchedAt ? `更新: ${new Date(fetchedAt).toLocaleTimeString('ja-JP')}` : ''}
      </span>
      <button type="button" className="button" onClick={onReload} disabled={loading}>
        再読み込み
      </button>
    </div>
  );
}
