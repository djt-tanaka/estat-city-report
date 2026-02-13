import { describe, it, expect } from "vitest";
import { filterCondoTrades, parseTradePrices, calculatePriceStats } from "../../src/reinfo/stats";
import { ReinfoTradeRecord } from "../../src/reinfo/types";

function makeTrade(overrides: Partial<ReinfoTradeRecord> = {}): ReinfoTradeRecord {
  return {
    Type: "中古マンション等",
    TradePrice: "35000000",
    Area: "70",
    BuildingYear: "2010",
    FloorPlan: "3LDK",
    Prefecture: "東京都",
    Municipality: "新宿区",
    DistrictName: "西新宿",
    ...overrides,
  };
}

describe("filterCondoTrades", () => {
  it("Type が '中古マンション等' のレコードのみ抽出する", () => {
    const trades = [
      makeTrade(),
      makeTrade({ Type: "宅地(土地と建物)" }),
      makeTrade({ Type: "中古マンション等" }),
    ];
    const result = filterCondoTrades(trades);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.Type === "中古マンション等")).toBe(true);
  });

  it("空配列を渡すと空配列を返す", () => {
    expect(filterCondoTrades([])).toEqual([]);
  });

  it("該当レコードがない場合は空配列を返す", () => {
    const trades = [makeTrade({ Type: "宅地(土地)" })];
    expect(filterCondoTrades(trades)).toEqual([]);
  });
});

describe("parseTradePrices", () => {
  it("TradePrice を数値配列に変換する", () => {
    const trades = [
      makeTrade({ TradePrice: "35000000" }),
      makeTrade({ TradePrice: "28000000" }),
    ];
    expect(parseTradePrices(trades)).toEqual([35000000, 28000000]);
  });

  it("無効な価格（空文字、非数値）は除外する", () => {
    const trades = [
      makeTrade({ TradePrice: "35000000" }),
      makeTrade({ TradePrice: "" }),
      makeTrade({ TradePrice: "非公開" }),
    ];
    expect(parseTradePrices(trades)).toEqual([35000000]);
  });

  it("0円の取引は除外する", () => {
    const trades = [
      makeTrade({ TradePrice: "35000000" }),
      makeTrade({ TradePrice: "0" }),
    ];
    expect(parseTradePrices(trades)).toEqual([35000000]);
  });
});

describe("calculatePriceStats", () => {
  it("奇数個の価格から中央値・Q25・Q75を計算する", () => {
    const prices = [20000000, 30000000, 35000000, 40000000, 50000000];
    const stats = calculatePriceStats(prices, "2024");
    expect(stats).not.toBeNull();
    expect(stats!.median).toBe(35000000);
    expect(stats!.count).toBe(5);
    expect(stats!.year).toBe("2024");
    expect(stats!.q25).toBeLessThan(stats!.median);
    expect(stats!.q75).toBeGreaterThan(stats!.median);
  });

  it("偶数個の価格から中央値を計算する", () => {
    const prices = [20000000, 30000000, 40000000, 50000000];
    const stats = calculatePriceStats(prices, "2024");
    expect(stats).not.toBeNull();
    expect(stats!.median).toBe(35000000);
    expect(stats!.count).toBe(4);
  });

  it("1件のみの場合は全て同じ値を返す", () => {
    const stats = calculatePriceStats([35000000], "2024");
    expect(stats).not.toBeNull();
    expect(stats!.median).toBe(35000000);
    expect(stats!.q25).toBe(35000000);
    expect(stats!.q75).toBe(35000000);
    expect(stats!.count).toBe(1);
  });

  it("空配列の場合は null を返す", () => {
    expect(calculatePriceStats([], "2024")).toBeNull();
  });

  it("ソートされていない入力でも正しく計算する", () => {
    const prices = [50000000, 20000000, 40000000, 30000000, 35000000];
    const stats = calculatePriceStats(prices, "2024");
    expect(stats!.median).toBe(35000000);
  });
});
