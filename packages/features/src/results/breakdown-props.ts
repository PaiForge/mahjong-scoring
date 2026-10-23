import type { FuDetail, YakuDetail } from "@mahjong-scoring/core";

import type { ScoreTableFocus } from "../score-table/focus";
import type { BreakdownJudgement } from "./breakdown-tabs";

/**
 * 内訳の表を載せる面（`BreakdownPanel` の `surface`。web とアプリで共有）
 * 内訳の面
 *
 * - `raised` — 白地に淡い枠。灰の地（結果一覧のアコーディオンの本文）や
 *   面を持たない場所に置くとき
 * - `sunken` — 枠なしの淡い灰。白い面（答え合わせの表の枠・答え合わせの資料の面）
 *   の中に置くとき。白い枠を入れ子にせず、「本体」と「その説明」を地の色で分ける
 */
export type BreakdownSurface = "raised" | "sunken";

/**
 * 合計符の内訳表示（`FuBreakdown`）の props（web とアプリで共有）
 * 符内訳props
 *
 * 回答後のフィードバックとして、副底から待ち符までの各構成要素とその合計、
 * そして 10 符単位への切り上げを示す（行の組み立ては `use-fu-breakdown.ts`）。
 */
export interface FuBreakdownProps {
  /** 切り上げ前の符の内訳 */
  readonly details: readonly FuDetail[];
  /** 切り上げ後の符（正解） */
  readonly answer: number;
  /**
   * `breakdownTotal` / `roundedUp` / `fuSuffix` を持つ翻訳名前空間（例: "totalFu"）
   */
  readonly translationNamespace: string;
  /** 開いた内訳の表を載せる面（既定 `raised`）。白い面の中に置くときは `sunken` */
  readonly surface?: BreakdownSurface;
}

/**
 * 合計符の内訳の表（開閉の器なし。`FuBreakdownTable`）の props
 * 符内訳表props
 *
 * 翻数の内訳と切り替えて出す場所（`ScoreBreakdownPanel`）では、開閉は
 * 置く側が持つので表だけを使う。
 */
export interface FuBreakdownTableProps extends Omit<
  FuBreakdownProps,
  "surface"
> {
  /**
   * 答えの符（切り上げ後、切り上げが無ければ合計）を押したときの処理。
   * 渡すとその値が点数表を開くボタンになる
   */
  readonly onOpenScoreTable?: () => void;
}

/**
 * 翻数の内訳表示（`YakuBreakdown`）の props（web とアプリで共有）
 * 翻内訳props
 *
 * 成立していた役とその翻数、合計を示す。「何翻だったか」だけでは翻数の
 * 数え間違いを直せない — どの役を見落とし、どの役を数えすぎたのかは内訳を
 * 並べて初めて分かる。
 *
 * @typeParam TNote - 補足の型。web は ReactNode（リンクを含む）、アプリは文字列
 */
export interface YakuBreakdownProps<TNote = string> {
  /** 役の内訳（ドラ・裏ドラを含む） */
  readonly yakuDetails: readonly YakuDetail[];
  /** 合計の後に効く丸めの補足（役満止まりなど）。持たない画面もある */
  readonly note?: TNote;
  /**
   * 合計がそのまま答えにならないときの答えの行（翻数即答の「13翻以上は 役満」）。
   * 符の内訳の「切り上げ後 40符」と同じく、合計の下に結論として据える
   */
  readonly conclusion?: { readonly label: string; readonly value: string };
  /** 開いた内訳の表を載せる面（既定 `raised`）。白い面の中に置くときは `sunken` */
  readonly surface?: BreakdownSurface;
}

/**
 * 翻数の内訳の表（開閉の器なし。`YakuBreakdownTable`）の props
 * 翻内訳表props
 */
export interface YakuBreakdownTableProps<TNote = string> extends Omit<
  YakuBreakdownProps<TNote>,
  "surface"
> {
  /** 合計の翻数を押したときの処理。渡すとその値が点数表を開くボタンになる */
  readonly onOpenScoreTable?: () => void;
}

/**
 * 点数系の答え合わせに添える翻数・符の内訳（`ScoreBreakdownPanel`）の props（web とアプリで共有）
 * 点数内訳パネルprops
 *
 * 符の内訳と翻数の内訳を 1 つの入口から切り替えて読ませる。昇級試験の
 * 答え合わせと結果ページの問題別詳細で使う。
 *
 * @typeParam TNote - 補足の型。web は ReactNode、アプリは文字列
 */
export interface ScoreBreakdownPanelProps<TNote = string> {
  /**
   * 符の内訳と正解の符。5 翻以上の問題（符が点数に効かない）では渡さない。
   * 符で満貫に届いた 4 翻以下の問題には渡す
   */
  readonly fu?: {
    readonly details: readonly FuDetail[];
    readonly answer: number;
  };
  /** 役の内訳（ドラ・裏ドラを含む） */
  readonly yakuDetails: readonly YakuDetail[];
  /** 翻数の合計の後に効く丸めの補足（役満止まりなど） */
  readonly yakuNote?: TNote;
  /** 翻数・符の正誤。分かる画面だけが渡し、開いたときに間違えたほうを選ぶ */
  readonly judgement?: BreakdownJudgement;
  /**
   * この問題の正解の位置（親子・ロンツモ・翻・符）。渡すと内訳の答えの値と
   * 内訳の下の「点数表を確認」から点数表をモーダルで開ける
   */
  readonly scoreTableFocus?: ScoreTableFocus;
  /** 開いた内訳の表を載せる面（既定 `raised`）。白い面の中に置くときは `sunken` */
  readonly surface?: BreakdownSurface;
}
