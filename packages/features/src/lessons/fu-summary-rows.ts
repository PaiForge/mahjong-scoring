/**
 * 符の早見表の 1 行（辞書キーと符）
 * 符早見表行
 *
 * `key` は各レッスンの辞書の名前空間（`jantouFu.learn` 等）の下のキー。
 * 表の見出しや体裁はアプリが持ち、どの行が何符かだけをここに置いて、
 * web とモバイルのレッスンが同じ表を出すようにする。
 */
export interface FuSummaryRow {
  readonly key: string;
  readonly fu: number;
}

/** 雀頭の符の早見表（`jantouFu.learn`） */
export const JANTOU_FU_SUMMARY_ROWS = [
  { key: "rowSangen", fu: 2 },
  { key: "rowBakaze", fu: 2 },
  { key: "rowJikaze", fu: 2 },
  { key: "rowOther", fu: 0 },
] as const satisfies readonly FuSummaryRow[];

/** 面子の符の早見表（`mentsuFu.learn`） */
export const MENTSU_FU_SUMMARY_ROWS = [
  { key: "rowShuntsu", fu: 0 },
  { key: "rowOpenSimpleKoutsu", fu: 2 },
  { key: "rowClosedSimpleKoutsuOrOpenYaochuKoutsu", fu: 4 },
  { key: "rowClosedYaochuKoutsuOrOpenSimpleKantsu", fu: 8 },
  { key: "rowClosedSimpleKantsuOrOpenYaochuKantsu", fu: 16 },
  { key: "rowClosedYaochuKantsu", fu: 32 },
] as const satisfies readonly FuSummaryRow[];

/** 待ちの符の早見表（`machiFu.learn`） */
export const MACHI_FU_SUMMARY_ROWS = [
  { key: "rowKanchan", fu: 2 },
  { key: "rowPenchan", fu: 2 },
  { key: "rowTanki", fu: 2 },
  { key: "rowRyanmen", fu: 0 },
  { key: "rowShanpon", fu: 0 },
] as const satisfies readonly FuSummaryRow[];
