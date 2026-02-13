import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs/promises";
import { fetchTradesWithCache, fetchCitiesWithCache } from "../../src/reinfo/cache";
import { ReinfoApiClient } from "../../src/reinfo/client";

vi.mock("node:fs/promises", () => ({
  default: {
    stat: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}));

vi.mock("../../src/reinfo/client");

const mockClient = {
  fetchTrades: vi.fn(),
  fetchCities: vi.fn(),
} as unknown as ReinfoApiClient;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchTradesWithCache", () => {
  it("キャッシュがない場合はAPIを呼び出して結果を書き込む", async () => {
    vi.mocked(fs.stat).mockRejectedValue(new Error("ENOENT"));
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue();
    const mockData = [{ Type: "中古マンション等", TradePrice: "30000000" }];
    vi.mocked(mockClient.fetchTrades).mockResolvedValue(mockData as any);

    const result = await fetchTradesWithCache(mockClient, {
      year: "2024",
      city: "13101",
    });

    expect(result).toEqual(mockData);
    expect(mockClient.fetchTrades).toHaveBeenCalledWith({
      year: "2024",
      city: "13101",
    });
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it("新鮮なキャッシュがある場合はAPIを呼ばない", async () => {
    const cached = [{ Type: "cached", TradePrice: "10000000" }];
    vi.mocked(fs.stat).mockResolvedValue({
      mtimeMs: Date.now() - 1000,
    } as any);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(cached));

    const result = await fetchTradesWithCache(mockClient, {
      year: "2024",
      city: "13101",
    });

    expect(result).toEqual(cached);
    expect(mockClient.fetchTrades).not.toHaveBeenCalled();
  });

  it("TTL超過のキャッシュはAPIを呼び出す", async () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    vi.mocked(fs.stat).mockResolvedValue({ mtimeMs: eightDaysAgo } as any);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.mocked(mockClient.fetchTrades).mockResolvedValue([]);

    const result = await fetchTradesWithCache(mockClient, {
      year: "2024",
      city: "13101",
    });

    expect(result).toEqual([]);
    expect(mockClient.fetchTrades).toHaveBeenCalled();
  });

  it("quarterパラメータがキャッシュキーに含まれる", async () => {
    vi.mocked(fs.stat).mockRejectedValue(new Error("ENOENT"));
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.mocked(mockClient.fetchTrades).mockResolvedValue([]);

    await fetchTradesWithCache(mockClient, {
      year: "2024",
      city: "13101",
      quarter: "2",
    });

    // キャッシュファイル名に quarter が含まれること
    const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
    expect(writeCall[0]).toContain("_q2");
  });
});

describe("fetchCitiesWithCache", () => {
  it("キャッシュがない場合はAPIを呼び出す", async () => {
    vi.mocked(fs.stat).mockRejectedValue(new Error("ENOENT"));
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue();
    const mockData = [{ id: "13101", name: "千代田区" }];
    vi.mocked(mockClient.fetchCities).mockResolvedValue(mockData as any);

    const result = await fetchCitiesWithCache(mockClient, "13");

    expect(result).toEqual(mockData);
    expect(mockClient.fetchCities).toHaveBeenCalledWith("13");
  });

  it("新鮮なキャッシュがある場合はAPIを呼ばない", async () => {
    const cached = [{ id: "13101", name: "千代田区" }];
    vi.mocked(fs.stat).mockResolvedValue({
      mtimeMs: Date.now() - 1000,
    } as any);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(cached));

    const result = await fetchCitiesWithCache(mockClient, "13");

    expect(result).toEqual(cached);
    expect(mockClient.fetchCities).not.toHaveBeenCalled();
  });
});
