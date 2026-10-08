import { changeToColor } from '../lib/color';
import { changeArrow, formatChange, formatCompact, formatPercent, formatPrice } from '../lib/format';
import { PERIOD_LABELS } from '../markets/labels';
import type { CurrencyCode, PeriodId } from '../markets/types';
import type { TileData } from './Heatmap';

interface Props {
  tile: TileData;
  x: number;
  y: number;
  containerWidth: number;
  containerHeight: number;
  currency: CurrencyCode;
  period: PeriodId;
  shareLabel: string;
}

const WIDTH = 240;
const HEIGHT = 170;
const OFFSET = 14;

export function Tooltip({ tile, x, y, containerWidth, containerHeight, currency, period, shareLabel }: Props) {
  const { asset, change, share } = tile;
  // 右端・下端ではカーソルの反対側に出す
  const left = x + OFFSET + WIDTH > containerWidth ? Math.max(0, x - OFFSET - WIDTH) : x + OFFSET;
  const top = y + OFFSET + HEIGHT > containerHeight ? Math.max(0, y - OFFSET - HEIGHT) : y + OFFSET;

  return (
    <div className="tooltip" style={{ left, top, width: WIDTH }} role="tooltip">
      <div className="tooltip-head">
        {asset.imageUrl && <img src={asset.imageUrl} alt="" width={20} height={20} />}
        <strong>{asset.symbol}</strong>
        <span className="tooltip-name">{asset.name}</span>
      </div>
      <dl>
        <dt>価格</dt>
        <dd>{formatPrice(asset.price, currency)}</dd>
        <dt>{PERIOD_LABELS[period]}</dt>
        <dd>
          <span className="tooltip-change" style={{ background: changeToColor(change, period) }}>
            {changeArrow(change)} {formatChange(change)}
          </span>
        </dd>
        <dt>時価総額</dt>
        <dd>{formatCompact(asset.marketCap, currency)}</dd>
        <dt>取引高(24h)</dt>
        <dd>{formatCompact(asset.volume, currency)}</dd>
        <dt>{shareLabel}</dt>
        <dd>{formatPercent(share)}</dd>
      </dl>
    </div>
  );
}
