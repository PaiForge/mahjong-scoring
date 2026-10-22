import type { HaiKindId, Tehai } from "@mahjong-scoring/core";

import type { HandPresentation } from "./hand-presentation";

/**
 * 手牌の牌画像表示（`TehaiHand`）の props（web とアプリで共有）
 * 手牌牌表示props
 *
 * 練習の出題盤面（`TehaiDisplay`）と各種早見表で共有する、牌の「出し方」の
 * 契約。コンテキスト情報（場風・自風・ドラ等）は含めず、牌の並びのみを描く。
 * 並びは実卓の開示に合わせ、純手牌を隙間なく並べ、間隔を空けて和了牌を右に
 * 置き、さらに広い間隔を空けて副露を並べる（間隔は `hand-layout.ts`）。
 */
export interface TehaiHandProps {
  /** 表示する手牌（純手牌 + 副露）。Tehai14 もそのまま渡せる。 */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  /**
   * 和了牌。渡すと純手牌から1枚抜き、間隔を空けて右側に開示する。
   * 和了形ではない手牌（役の早見表など）では省略する。
   */
  readonly agariHai?: HaiKindId;
  /**
   * 和了牌に添えるラベル（「ツモ」「ロン」）。訳語は呼び出し側で解決する。
   * この共有コンポーネントは牌の並びだけを負い、辞書の名前空間を知らない。
   */
  readonly agariLabel?: string;
  /**
   * 和了ラベルを載せる面の明暗。既定は濃い出題盤面（TehaiDisplay）。
   * 早見表のような明るい面に置くときだけ "light" を渡す。
   */
  readonly agariLabelTone?: "dark" | "light";
  /** 自動スケール値の変化通知（コンテキスト牌などを同じ倍率で揃える用途） */
  readonly onScaleChange?: (scale: number) => void;
  /**
   * 純手牌と和了牌の見せ方（並びと上下）。省略時は理牌・正規の向き
   *
   * 添字はここで `tehai.closed` と `agariHai` から切り離した純手牌に対するもの。
   * 呼び出し側も同じ元の手牌から同じ規則（`splitAgariHai`）で計算して渡す。
   * このコンポーネントはコンテキスト・設定・特典を読まず、受け取ったものだけで
   * 描く。手牌に合わない見せ方は全体を従来の表示に戻す（`presentTehai`）。
   * 副露は変えない。
   */
  readonly presentation?: HandPresentation;
}
