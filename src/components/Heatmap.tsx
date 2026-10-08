import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useElementSize } from '../hooks/useElementSize';
import { changeToColor } from '../lib/color';
import { changeArrow, formatChange, formatPercent, formatPrice } from '../lib/format';
import { layoutTileLabel } from '../lib/tileLabel';
import { squarify, type LayoutNode } from '../lib/treemap';
import type { Asset, CurrencyCode, MarketSnapshot, PeriodId, SizeMetric } from '../markets/types';
import { Tooltip } from './Tooltip';

interface Props {
  snapshot: MarketSnapshot;
  period: PeriodId;
  sizeMetric: SizeMetric;
  currency: CurrencyCode;
  limit: number;
  shareLabel: string;
}

export interface TileData {
  asset: Asset;
  change: number | null;
  share: number;
}

export function Heatmap({ snapshot, period, sizeMetric, currency, limit, shareLabel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(containerRef);
  const [hover, setHover] = useState<{ tile: TileData; x: number; y: number } | null>(null);

  const tiles = useMemo<TileData[]>(() => {
    // 上位 limit 件で打ち切る（provider 側でも絞っているが念のため）
    const assets = [...snapshot.assets].sort((a, b) => b.marketCap - a.marketCap).slice(0, limit);
    const total = snapshot.totalMarketCap ?? assets.reduce((acc, a) => acc + a.marketCap, 0);
    return assets.map((asset) => ({
      asset,
      change: asset.changes[period] ?? null,
      share: total > 0 ? asset.marketCap / total : 0,
    }));
  }, [snapshot, period, limit]);

  const layout = useMemo(
    () => squarify(tiles, (t) => t.asset[sizeMetric], { x: 0, y: 0, width, height }),
    [tiles, sizeMetric, width, height],
  );

  const handleHover = useCallback((tile: TileData | null, clientX = 0, clientY = 0) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!tile || !rect) {
      setHover(null);
      return;
    }
    setHover({ tile, x: clientX - rect.left, y: clientY - rect.top });
  }, []);

  return (
    <div className="heatmap" ref={containerRef} onMouseLeave={() => handleHover(null)}>
      {layout.map((node) => (
        <Tile
          key={node.item.asset.id}
          node={node}
          period={period}
          currency={currency}
          shareLabel={shareLabel}
          onHover={handleHover}
        />
      ))}
      {hover && (
        <Tooltip
          tile={hover.tile}
          x={hover.x}
          y={hover.y}
          containerWidth={width}
          containerHeight={height}
          currency={currency}
          period={period}
          shareLabel={shareLabel}
        />
      )}
    </div>
  );
}

interface TileProps {
  node: LayoutNode<TileData>;
  period: PeriodId;
  currency: CurrencyCode;
  shareLabel: string;
  onHover: (tile: TileData | null, clientX?: number, clientY?: number) => void;
}

const Tile = memo(function Tile({ node, period, currency, shareLabel, onHover }: TileProps) {
  const { asset, change, share } = node.item;
  const price = formatPrice(asset.price, currency);
  const changeText = `${changeArrow(change)} ${formatChange(change)}`.trim();
  const shareText = `${shareLabel} : ${formatPercent(share)}`;
  const label = layoutTileLabel({
    width: node.width,
    height: node.height,
    symbol: asset.symbol,
    price,
    change: changeText,
    share: shareText,
  });

  return (
    <div
      className="tile"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        background: changeToColor(change, period),
      }}
      onMouseMove={(e) => onHover(node.item, e.clientX, e.clientY)}
    >
      {label.showSymbol && (
        <div className="tile-body">
          <div className="tile-symbol" style={{ fontSize: label.symbolSize }}>
            {asset.symbol}
          </div>
          <div className="tile-detail" style={{ fontSize: label.detailSize }}>
            {label.showPrice && <div>{price}</div>}
            {label.showChange && <div>{changeText}</div>}
            {label.showShare && <div>{shareText}</div>}
          </div>
        </div>
      )}
    </div>
  );
});
