/**
 * タイルの大きさから、どの情報をどのフォントサイズで表示するかを決める。
 * 大きいタイルほど多くの情報を出し、小さいタイルは記号のみ・または何も出さない。
 */

export interface TileLabelInput {
  width: number;
  height: number;
  symbol: string;
  price: string;
  change: string;
  share: string;
}

export interface TileLabelLayout {
  symbolSize: number;
  detailSize: number;
  showSymbol: boolean;
  showPrice: boolean;
  showChange: boolean;
  showShare: boolean;
}

const MIN_SYMBOL_PX = 7;
const MIN_DETAIL_PX = 8;
const MAX_SYMBOL_PX = 150;
/** 1 文字あたりの概算幅（フォントサイズ比）。大文字主体の銘柄名に合わせてやや広めに見積もる */
const CHAR_WIDTH = 0.68;

export function layoutTileLabel(input: TileLabelInput): TileLabelLayout {
  const { width, height } = input;
  const hidden: TileLabelLayout = {
    symbolSize: 0,
    detailSize: 0,
    showSymbol: false,
    showPrice: false,
    showChange: false,
    showShare: false,
  };

  const symbolSize = Math.min(
    (width * 0.85) / (Math.max(input.symbol.length, 2) * CHAR_WIDTH),
    height * 0.3,
    MAX_SYMBOL_PX,
  );
  if (symbolSize < MIN_SYMBOL_PX) return hidden;

  const longest = Math.max(input.price.length, input.change.length + 2, input.share.length);
  const detailSize = Math.min(symbolSize * 0.4, (width * 0.9) / (longest * CHAR_WIDTH * 0.95), 44);

  const result: TileLabelLayout = { ...hidden, symbolSize, detailSize, showSymbol: true };
  if (detailSize < MIN_DETAIL_PX) return result;

  // 優先度順に、縦に収まる限り行を追加する
  const available = height * 0.9 - symbolSize * 1.1;
  const lineHeight = detailSize * 1.35;
  const priority: (keyof Pick<TileLabelLayout, 'showChange' | 'showPrice' | 'showShare'>)[] = [
    'showChange',
    'showPrice',
    'showShare',
  ];
  priority.forEach((flag, i) => {
    if (lineHeight * (i + 1) <= available) result[flag] = true;
  });
  return result;
}
