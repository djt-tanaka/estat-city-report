export interface ReportRow {
  readonly cityInput: string;
  readonly cityResolved: string;
  readonly areaCode: string;
  readonly total: number;
  readonly kids: number;
  readonly ratio: number;
  readonly totalRank: number;
  readonly ratioRank: number;
  /** Phase 1: 中古マンション価格中央値（万円） */
  readonly condoPriceMedian?: number | null;
  /** Phase 1: Q25-Q75レンジ（万円） */
  readonly condoPriceQ25?: number | null;
  readonly condoPriceQ75?: number | null;
  readonly condoPriceCount?: number | null;
}
