import { CondoPriceStats, ReinfoTradeRecord } from "./types";

const CONDO_TYPE = "中古マンション等";

/** "中古マンション等" のレコードのみ抽出 */
export function filterCondoTrades(
  trades: ReadonlyArray<ReinfoTradeRecord>
): ReadonlyArray<ReinfoTradeRecord> {
  return trades.filter((t) => t.Type === CONDO_TYPE);
}

/** 取引価格を数値配列に変換（無効値・0円を除外） */
export function parseTradePrices(
  trades: ReadonlyArray<ReinfoTradeRecord>
): ReadonlyArray<number> {
  return trades
    .map((t) => Number(t.TradePrice))
    .filter((p) => Number.isFinite(p) && p > 0);
}

/** 分位数計算（線形補間） */
function quantile(sorted: ReadonlyArray<number>, p: number): number {
  if (sorted.length === 1) {
    return sorted[0];
  }
  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;
  return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
}

/** 統計値を計算（中央値、Q25、Q75）。空配列の場合は null */
export function calculatePriceStats(
  prices: ReadonlyArray<number>,
  year: string
): CondoPriceStats | null {
  if (prices.length === 0) {
    return null;
  }

  const sorted = [...prices].sort((a, b) => a - b);

  return {
    median: quantile(sorted, 0.5),
    q25: quantile(sorted, 0.25),
    q75: quantile(sorted, 0.75),
    count: sorted.length,
    year,
  };
}
