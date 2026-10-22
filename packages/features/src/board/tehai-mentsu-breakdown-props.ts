import type { MentsuBreakdownContext, Tehai } from "@mahjong-scoring/core";

/**
 * 面子分解の表（`TehaiMentsuBreakdown`）の props（web とアプリで共有）
 * 面子分解表props
 *
 * 和了形を 4 面子 + 雀頭に分けた表をモーダルで見せる。答えが割れるので、
 * 回答を受け付けている間は置かず、正解を開示する文脈（結果の問題詳細と、
 * トレーニング・模試で止まっている間）に限る。候補の計算は
 * `use-mentsu-breakdown.ts`。
 */
export interface TehaiMentsuBreakdownProps {
  /** 分割する手牌（和了牌を含む14枚。純手牌 + 副露） */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  /**
   * 和了状況。分割の解決（= 点数計算と同じ構造選択）に使う。
   * 出題がドラ表示牌を持つならそれも渡す（候補の順位を採点と揃えるため）
   */
  readonly context: MentsuBreakdownContext;
}
