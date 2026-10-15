import { MentsuType } from "@mahjong-scoring/core";
import type { MentsuBreakdownRow } from "@mahjong-scoring/core";

/**
 * 面子分解の行の種別名の辞書キー
 * 面子種別キー
 *
 * 刻子・槓子は符計算上の明暗（`isOpen`）で呼び分ける。ロンで完成した
 * 刻子は手牌の中にあっても明刻になる。
 */
export type MentsuBreakdownLabelKey =
  "shuntsu" | "minkou" | "ankou" | "minkan" | "ankan";

/**
 * 面子分解の行の種別名（順子・明刻・暗刻・明槓・暗槓）の辞書キーを引く
 * 面子種別キー取得
 */
export function mentsuBreakdownLabelKey(
  row: MentsuBreakdownRow,
): MentsuBreakdownLabelKey {
  switch (row.mentsu.type) {
    case MentsuType.Shuntsu:
      return "shuntsu";
    case MentsuType.Koutsu:
      return row.isOpen ? "minkou" : "ankou";
    case MentsuType.Kantsu:
      return row.isOpen ? "minkan" : "ankan";
  }
}
