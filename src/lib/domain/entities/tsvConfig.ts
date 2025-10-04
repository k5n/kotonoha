/**
 * TSVファイルのカラム設定
 */
export type TsvConfig = {
  readonly startTimeColumnIndex: number;
  readonly textColumnIndex: number;
  readonly endTimeColumnIndex?: number;
};
