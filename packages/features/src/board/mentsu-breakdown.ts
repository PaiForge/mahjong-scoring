import { MentsuType, resolveMentsuBreakdowns } from "@mahjong-scoring/core";
import type {
  MentsuBreakdownContext,
  MentsuBreakdownRow,
  Tehai,
} from "@mahjong-scoring/core";

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

/**
 * 手牌が面子分解の表（`TehaiMentsuBreakdown`）を持つか
 * 面子分解有無
 *
 * 面子手でない和了（七対子・国士無双）には分解が無く、`TehaiMentsuBreakdown`
 * は何も描かない。面子分解だけを入れる面（答え合わせの資料の面）は、空の
 * 枠を出さないよう置く前にこれで確かめる。候補の解決は表と同じ関数
 * （`resolveMentsuBreakdowns`）なので、表が出る条件と食い違わない。
 */
export function hasMentsuBreakdown(
  tehai: Pick<Tehai, "closed" | "exposed">,
  context: MentsuBreakdownContext,
): boolean {
  return resolveMentsuBreakdowns(tehai, context).length > 0;
}
