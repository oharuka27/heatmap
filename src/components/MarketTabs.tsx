import { MARKETS, isMarketAvailable } from '../markets/registry';
import type { MarketId } from '../markets/types';

interface Props {
  value: MarketId;
  onChange: (id: MarketId) => void;
}

export function MarketTabs({ value, onChange }: Props) {
  return (
    <nav className="tabs" role="tablist" aria-label="マーケット">
      {MARKETS.map((m) => {
        const available = isMarketAvailable(m);
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={m.id === value}
            className="tab"
            disabled={!available}
            title={available ? undefined : '準備中'}
            onClick={() => onChange(m.id)}
          >
            {m.label}
            {!available && <span className="tab-badge">準備中</span>}
          </button>
        );
      })}
    </nav>
  );
}
