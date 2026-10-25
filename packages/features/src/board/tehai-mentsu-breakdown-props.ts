import type { MentsuBreakdownContext, Tehai } from "@mahjong-scoring/core";

/**
 * 面子分解の表（`TehaiMentsuBreakdown`）の props（web とアプリで共有）
 * 面子分解表props
 *
 * 和了形を 4 面子 + 雀頭に分けた表をモーダルで見せる。答えが割れるので、
 * 回答を受け付けている間に置くのは、分解そのものをヒントとして見せると
 * 決めた練習（和了形の点数計算）だけで、そのときは {@link hint} を立てる。
 * それ以外は正解を開示する文脈（結果の問題詳細と、トレーニング・模試で
 * 止まっている間）に限る。候補の計算は `use-mentsu-breakdown.ts`。
 */
export interface TehaiMentsuBreakdownProps {
  /** 分割する手牌（和了牌を含む14枚。純手牌 + 副露） */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  /**
   * 和了状況。分割の解決（= 点数計算と同じ構造選択）に使う。
   * 出題がドラ表示牌を持つならそれも渡す（候補の順位を採点と揃えるため）
   */
  readonly context: MentsuBreakdownContext;
  /**
   * 回答中のヒントとして出すか
   *
   * 入口の文言を「ヒント」にし、解釈の候補の切り替えを出さずに高点法の先頭の
   * 解釈だけを見せる。切り替えのタブは「30符 2翻」と「最高点」の印を持ち、
   * 翻数・符を答える前に見せると答えそのものになるため。分解（明暗の種別と
   * 和了牌の位置）からも符の材料は読めるが、それはヒントとして渡す範囲に含める
   * — 面子の取り方と待ちの読み方こそが初心者のつまずく所で、ヒントの中身だから
   */
  readonly hint?: boolean;
}
