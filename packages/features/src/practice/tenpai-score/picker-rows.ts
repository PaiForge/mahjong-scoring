import { HaiKind } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";

/**
 * 待ち牌の選択肢の 1 行（牌の種類ごと）
 * 待ち牌選択行
 */
export interface MachiPickerRow {
  /** 行の名前の辞書キー（`tenpaiScore.suits.<key>`） */
  readonly key: "manzu" | "pinzu" | "souzu" | "jihai";
  readonly tiles: readonly HaiKindId[];
}

/** 牌種 ID は種類ごとに連番なので、先頭の ID から数えて拾う */
function rangeOf(from: HaiKindId, count: number): readonly HaiKindId[] {
  return Object.values(HaiKind).filter((id) => id >= from && id < from + count);
}

/**
 * 待ち牌の選択肢を牌の種類ごとに並べた行
 * 待ち牌選択肢
 *
 * 数牌は 1〜9、字牌は東南西北白發中の順。
 */
export const MACHI_PICKER_ROWS: readonly MachiPickerRow[] = [
  { key: "manzu", tiles: rangeOf(HaiKind.ManZu1, 9) },
  { key: "pinzu", tiles: rangeOf(HaiKind.PinZu1, 9) },
  { key: "souzu", tiles: rangeOf(HaiKind.SouZu1, 9) },
  { key: "jihai", tiles: rangeOf(HaiKind.Ton, 7) },
];
