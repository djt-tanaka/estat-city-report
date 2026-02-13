/** XIT001 レスポンスの取引レコード */
export interface ReinfoTradeRecord {
  readonly Type: string;
  readonly TradePrice: string;
  readonly Area: string;
  readonly BuildingYear: string;
  readonly FloorPlan: string;
  readonly Prefecture: string;
  readonly Municipality: string;
  readonly DistrictName: string;
  readonly PricePerUnit?: string;
  readonly NearestStation?: string;
  readonly TimeToNearestStation?: string;
  readonly TotalFloorArea?: string;
  readonly CityCode?: string;
  readonly PrefectureCode?: string;
}

/** XIT001 APIレスポンス */
export interface ReinfoTradeResponse {
  readonly status: string;
  readonly data: ReadonlyArray<ReinfoTradeRecord>;
}

/** XIT002 レスポンスの市区町村レコード */
export interface ReinfoCityRecord {
  readonly id: string;
  readonly name: string;
}

/** マンション価格の統計結果 */
export interface CondoPriceStats {
  readonly median: number;
  readonly q25: number;
  readonly q75: number;
  readonly count: number;
  readonly year: string;
}
