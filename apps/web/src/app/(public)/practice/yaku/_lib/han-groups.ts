/**
 * 翻数グループの定義
 * 翻数グループ
 */
export interface HanGroup {
  readonly key: string;
  readonly startIndex: number;
  readonly endIndex: number;
}

/** SELECTABLE_YAKU 配列のスライスに対応する翻数グループ */
export const HAN_GROUPS: readonly HanGroup[] = [
  { key: "1", startIndex: 0, endIndex: 12 },
  { key: "2", startIndex: 12, endIndex: 22 },
  { key: "3", startIndex: 22, endIndex: 25 },
  { key: "6", startIndex: 25, endIndex: 26 },
  { key: "yakuman", startIndex: 26, endIndex: 36 },
];
