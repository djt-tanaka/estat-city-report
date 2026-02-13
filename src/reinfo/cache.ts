import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir } from "../utils";
import { ReinfoApiClient } from "./client";
import { ReinfoTradeRecord, ReinfoCityRecord } from "./types";

const CACHE_DIR = path.resolve(".cache", "reinfo");
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function tradeCachePath(city: string, year: string, quarter?: string): string {
  const suffix = quarter ? `_q${quarter}` : "";
  return path.join(CACHE_DIR, `trades_${city}_${year}${suffix}.json`);
}

function cityCachePath(area: string): string {
  return path.join(CACHE_DIR, `cities_${area}.json`);
}

async function readCacheIfFresh<T>(filePath: string): Promise<T | null> {
  try {
    const stat = await fs.stat(filePath);
    const age = Date.now() - stat.mtimeMs;
    if (age <= TTL_MS) {
      const content = await fs.readFile(filePath, "utf8");
      return JSON.parse(content) as T;
    }
  } catch {
    // キャッシュなし or 読み込み失敗 → API呼び出しにフォールバック
  }
  return null;
}

async function writeCache(filePath: string, data: unknown): Promise<void> {
  await ensureDir(CACHE_DIR);
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

/** 取引データをキャッシュ付きで取得 */
export async function fetchTradesWithCache(
  client: ReinfoApiClient,
  params: { year: string; city: string; quarter?: string },
): Promise<ReadonlyArray<ReinfoTradeRecord>> {
  const filePath = tradeCachePath(params.city, params.year, params.quarter);
  const cached = await readCacheIfFresh<ReadonlyArray<ReinfoTradeRecord>>(filePath);
  if (cached !== null) {
    return cached;
  }

  const data = await client.fetchTrades(params);
  await writeCache(filePath, data);
  return data;
}

/** 市区町村一覧をキャッシュ付きで取得 */
export async function fetchCitiesWithCache(
  client: ReinfoApiClient,
  area: string,
): Promise<ReadonlyArray<ReinfoCityRecord>> {
  const filePath = cityCachePath(area);
  const cached = await readCacheIfFresh<ReadonlyArray<ReinfoCityRecord>>(filePath);
  if (cached !== null) {
    return cached;
  }

  const data = await client.fetchCities(area);
  await writeCache(filePath, data);
  return data;
}
