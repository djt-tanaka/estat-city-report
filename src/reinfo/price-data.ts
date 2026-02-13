import { ReinfoApiClient } from "./client";
import { CondoPriceStats } from "./types";
import { fetchTradesWithCache } from "./cache";
import { filterCondoTrades, parseTradePrices, calculatePriceStats } from "./stats";

const INTER_CITY_DELAY_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 複数都市のマンション取引価格統計を構築する。
 * 都市間に200msのディレイを入れてレート制限を回避する。
 */
export async function buildPriceData(
  client: ReinfoApiClient,
  areaCodes: ReadonlyArray<string>,
  year: string,
  quarter?: string,
): Promise<ReadonlyMap<string, CondoPriceStats>> {
  const result = new Map<string, CondoPriceStats>();

  for (let i = 0; i < areaCodes.length; i++) {
    if (i > 0) {
      await sleep(INTER_CITY_DELAY_MS);
    }

    const code = areaCodes[i];
    const trades = await fetchTradesWithCache(client, {
      year,
      city: code,
      quarter,
    });

    const condoTrades = filterCondoTrades(trades);
    const prices = parseTradePrices(condoTrades);
    const stats = calculatePriceStats(prices, year);

    if (stats !== null) {
      result.set(code, stats);
    }
  }

  return result;
}
