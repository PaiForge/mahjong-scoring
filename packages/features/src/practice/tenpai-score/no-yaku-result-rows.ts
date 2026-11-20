import { formatHan, formatPayment } from "../score/format-answer";
import { yakuLabel } from "../../yaku/yaku-labels";

import type { NoYakuResultDisplayProps } from "./result-props";

/**
 * 役なしの結果表の「あなたの回答」のセル
 * 役なし結果の回答セル
 *
 * - `judged` — 値と正誤（色と記号を付けて出す）
 * - `unanswered` — その行には答えていない（未回答の印を出す）
 */
export type NoYakuAnswerCell =
  | {
      readonly kind: "judged";
      readonly value: string;
      readonly isCorrect: boolean;
    }
  | { readonly kind: "unanswered" };

/**
 * 役なしの結果表の 1 行
 * 役なし結果の行
 */
export interface NoYakuResultRow {
  /** 行の種類（描画側の key に使う） */
  readonly key: "fu" | "han" | "score" | "yaku";
  /** 行の見出し（役・翻数・符・点数） */
  readonly label: string;
  /** あなたの回答 */
  readonly answer: NoYakuAnswerCell;
  /** 正解の値 */
  readonly correct: string;
}

/**
 * 役なしの結果表を組むのに使う翻訳と表示モード
 * 役なし結果の行オプション
 */
export interface NoYakuResultRowsOptions {
  /** `tenpaiScore` 名前空間の翻訳関数（`cells.noYakuShort` / `result.notApplicable` を引く） */
  readonly t: (key: string) => string;
  /** `agariScore` 名前空間の翻訳関数（`form.labels.*` / `form.options.*` / `result.*` を引く） */
  readonly tScore: (key: string) => string;
  /** `yakuNames` 名前空間の翻訳関数（選んだ役の名前を引く） */
  readonly tYakuNames: (key: string) => string;
  /** `common` 名前空間の翻訳関数（`listSeparator` を引く） */
  readonly tCommon: (key: string) => string;
  readonly allowDoubleYakuman: boolean;
}

const UNANSWERED: NoYakuAnswerCell = { kind: "unanswered" };

/**
 * 役が無くロンできないマスの答え合わせの行（役・翻数・符・点数）を組む
 * 役なし結果の行組み立て
 *
 * web とアプリの `NoYakuResultDisplay` が同じ行を出すための共有部分で、
 * 描き方（表のセル / View）だけを各アプリが持つ。
 *
 * 「役なし」は翻数の行に置く。役なしは翻数が無いという主張なので、
 * 和了形の結果表示が回答の「役なし」を置く行に揃える。符と点数の行は
 * 正解が値を持たないので「—」（`result.notApplicable`）。
 *
 * 回答の側は次のとおり。
 *
 * - 点数で答えた（= 役なしのマスに対する誤答）ときだけ、役・翻数・符・点数の
 *   行に値と正誤が入る。翻数と符を答えさせない出題（`requireHanFu` が false）では、
 *   翻数と符の行は未回答の印
 * - 役なしと答えたときは翻数の行にだけ「役なし」と正誤を置き、他の行は未回答の印
 * - 「わからない」での開示（`userAnswer` / `result` が undefined）はすべて未回答の印
 *
 * 役の行は役を答えさせる出題（`requireYaku`）のときだけ先頭に付く。選んだ役
 * （core の役名）は `yakuNames` で引き、言語の区切りで結ぶ（日本語の値は core の
 * 名前と「、」なので日本語の表示は変わらない）。
 *
 * @param props - 結果表示の props（回答・判定・出題モード）
 * @param options - 翻訳関数と表示モード
 */
export function buildNoYakuResultRows(
  {
    userAnswer,
    result,
    requireYaku,
    requireHanFu,
    exactHan,
  }: NoYakuResultDisplayProps,
  {
    t,
    tScore,
    tYakuNames,
    tCommon,
    allowDoubleYakuman,
  }: NoYakuResultRowsOptions,
): readonly NoYakuResultRow[] {
  // 点数で答えた（= 役なしのマスに対する誤答）ときだけ翻・符・点数の行に値が入る
  const scoreAnswer =
    userAnswer?.kind === "score" && result !== undefined
      ? { answer: userAnswer.answer, result }
      : undefined;
  const scoreAnswerHanFu = requireHanFu ? scoreAnswer : undefined;
  const noYakuResult =
    userAnswer?.kind === "noYaku" && result !== undefined ? result : undefined;

  const noYaku = t("cells.noYakuShort");
  const notApplicable = t("result.notApplicable");

  const yakuRow: NoYakuResultRow = {
    key: "yaku",
    label: tScore("form.labels.yaku"),
    answer: scoreAnswer
      ? {
          kind: "judged",
          value:
            scoreAnswer.answer.yakus.length > 0
              ? scoreAnswer.answer.yakus
                  .map((name) => yakuLabel(name, tYakuNames))
                  .join(tCommon("listSeparator"))
              : tScore("result.details.none"),
          isCorrect: scoreAnswer.result.isYakuCorrect,
        }
      : UNANSWERED,
    correct: tScore("result.details.none"),
  };

  const hanAnswer = (): NoYakuAnswerCell => {
    if (scoreAnswerHanFu) {
      return {
        kind: "judged",
        value:
          scoreAnswerHanFu.answer.han === undefined
            ? "-"
            : formatHan(scoreAnswerHanFu.answer.han, {
                t: tScore,
                exactHan,
                allowDoubleYakuman,
              }),
        isCorrect: scoreAnswerHanFu.result.isHanCorrect,
      };
    }
    if (noYakuResult) {
      return {
        kind: "judged",
        value: noYaku,
        isCorrect: noYakuResult.isCorrect,
      };
    }
    return UNANSWERED;
  };

  return [
    ...(requireYaku ? [yakuRow] : []),
    {
      key: "han",
      label: tScore("form.labels.han"),
      answer: hanAnswer(),
      correct: noYaku,
    },
    {
      key: "fu",
      label: tScore("form.labels.fu"),
      answer: scoreAnswerHanFu
        ? {
            kind: "judged",
            value: `${scoreAnswerHanFu.answer.fu ?? "-"}${tScore("form.options.fuSuffix")}`,
            isCorrect: scoreAnswerHanFu.result.isFuCorrect,
          }
        : UNANSWERED,
      correct: notApplicable,
    },
    {
      key: "score",
      label: tScore("form.labels.score"),
      answer: scoreAnswer
        ? {
            kind: "judged",
            value: formatPayment(scoreAnswer.answer, false, { t: tScore }),
            isCorrect: scoreAnswer.result.isScoreCorrect,
          }
        : UNANSWERED,
      correct: notApplicable,
    },
  ];
}
