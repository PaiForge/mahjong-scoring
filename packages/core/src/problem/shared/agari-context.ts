import type { HaiKindId, Kazehai } from "@pai-forge/riichi-mahjong";

/**
 * 和了状況（場風・自風のみ）
 * 風コンテキスト
 *
 * 役牌・雀頭符の判定に必要な最小限。雀頭符練習のように手牌を伴わない
 * 出題はこれだけを持つ。
 */
export interface KazeContext {
  readonly bakaze: Kazehai;
  readonly jikaze: Kazehai;
}

/**
 * 和了状況（和了牌と和了方法を含む）
 * 和了コンテキスト
 *
 * 手牌を提示する出題が共通で必要とする情報。ドラ・リーチは
 * 出題種別によって必須／任意が分かれるため、必要な型が個別に追加する。
 */
export interface AgariContext extends KazeContext {
  readonly agariHai: HaiKindId;
  readonly isTsumo: boolean;
}
