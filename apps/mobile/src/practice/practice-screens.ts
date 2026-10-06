import type { ReactNode } from "react";

import type { PracticeViewProps } from "./create-practice-views";

/**
 * 1 つの練習が持つ画面一式
 * 練習画面一式
 *
 * 練習ごとに違うのは盤面と結果の一覧だけで、画面の枠（説明・チャレンジ・
 * トレーニング・結果）は共通のルートが持つ。ルートは slug からこれを引いて
 * 中身を差し込む。
 */
export interface PracticeScreens {
  /** チャレンジ（記録なし・制限時間とミス上限あり） */
  readonly Play: (props: PracticeViewProps) => ReactNode;
  /** トレーニング（時間無制限・1 問ごとに答え合わせ） */
  readonly Training: (props: PracticeViewProps) => ReactNode;
  /**
   * 結果画面の問題別一覧（問題別の結果を持たない練習は省略）
   *
   * 結果はメモリの `unknown[]` で届くので、盤面の結果スキーマで検証してから
   * 描く（web が sessionStorage の値を検証するのと同じ）。
   */
  readonly ProblemList?: (props: {
    readonly results: readonly unknown[];
  }) => ReactNode;
  /**
   * 説明画面の「問題方式」に置く見本の盤面（省略時は説明文だけ）
   *
   * web の説明ページが実際の盤面で出題の形を見せるのと同じく、本物の盤面を
   * 回答できない状態で描く。
   */
  readonly Demo?: () => ReactNode;
}
