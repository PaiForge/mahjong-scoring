"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AnswerOutcome } from "../_lib/result-schemas";
import { DetailTable } from "./detail-table";

interface AnswerComparisonProps {
  /** i18n の翻訳ネームスペース（例: "totalFu"）。ラベルは `<ns>.result` から引く */
  readonly translationNamespace: string;
  /** 正解の表示内容 */
  readonly correct: ReactNode;
  /**
   * ユーザー回答の表示内容
   *
   * 時間切れ（`outcome` が `TimeUp`）の問題では見ない — 回答欄には
   * 「時間切れ（未回答）」を出す。呼び出し側は回答が無いとき undefined を
   * 渡してよい
   */
  readonly user: ReactNode;
  /**
   * 1 問の顛末（回答値の文字色に反映する）
   *
   * 正解 / 不正解は回答値を成功 / 失敗の色にする。時間切れは回答が無いので
   * 回答欄に「時間切れ（未回答）」を本文色で出し、過不足の行も付けない。
   * トレーニングで無回答のまま正解を開示したときは undefined を渡す。
   * 答えていない回答欄に正誤の色を乗せないため、本文色のままになる。
   */
  readonly outcome: AnswerOutcome | undefined;
  /**
   * 過不足を出すための正解と回答の値。数値で答える練習（符・翻）が渡す。
   * 渡すと「過不足」の行が最後に付く。時間切れの問題では回答が無いので
   * 渡さない（渡しても付けない）
   */
  readonly difference?: AnswerDifference;
  /**
   * 「答え合わせ」の見出しを出すか（既定: true）。
   * 詳細に並ぶ表がこれ 1 つだけで、見出しがなくても何の表かが明らかな練習は
   * false にして詳細を軽くする
   */
  readonly showTitle?: boolean;
}

/** 過不足の計算に使う正解と回答の値、そして単位の付け方 */
interface AnswerDifference {
  readonly correct: number;
  readonly user: number;
  /** 値に単位を付ける（`(3) => "3翻"` など。差の絶対値に対して呼ばれる） */
  readonly format: (value: number) => string;
}

/**
 * 「正解 / あなたの回答」の対比表示
 * 回答対比
 *
 * 各練習の問題別フィードバック（{@link ProblemListAccordion} の renderDetail）で
 * 共通に使う体裁。何を正解として見せるかは練習ごとに違うので、値の組み立ては
 * 呼び出し側に任せ、ここは並べ方と正誤の色分けだけを持つ。
 *
 * 表そのものは {@link DetailTable} に委ねる。同じ詳細の中に並ぶ符・翻の内訳と
 * 同じ形（名前と値の表）にして、詳細の中で見た目を割らない。
 *
 * 数値で答える練習は `difference` を渡して「過不足」の行で締める。内訳の
 * 合計行と同じ位置に同じ体裁の行が来るので、2つの表の丈が揃うだけでなく、
 * 「何翻ずれていたのか」がその場で読める。役の選択のように差が数値に
 * ならない練習は渡さない（過不足はチップの色が示している）。雀頭符・待ち符の
 * ように符が数段階しかない練習も渡さない（正解と回答の符が並んだ時点で差は
 * 読み取れており、行を足しても情報が増えない）。
 */
export function AnswerComparison({
  translationNamespace,
  correct,
  user,
  outcome,
  difference,
  showTitle = true,
}: AnswerComparisonProps) {
  const tResult = useTranslations(`${translationNamespace}.result`);
  const tCommon = useTranslations("common");
  const isTimeUp = outcome === AnswerOutcome.TimeUp;

  return (
    <DetailTable
      title={showTitle ? tCommon("answerCheck") : undefined}
      total={
        difference === undefined || isTimeUp
          ? undefined
          : {
              label: tCommon("difference"),
              value: formatDifference(difference, tCommon("noDifference")),
            }
      }
      rows={[
        { label: tResult("correctAnswer"), value: correct },
        {
          label: tResult("yourAnswer"),
          value: isTimeUp ? tCommon("timeUpAnswer") : user,
          // 正誤の色は回答値だけに乗せる（ラベルは常に中立色）。
          // 時間切れと無回答の開示は正誤ではないので本文色のまま
          tone:
            outcome === AnswerOutcome.Correct
              ? "correct"
              : outcome === AnswerOutcome.Incorrect
                ? "incorrect"
                : undefined,
        },
      ]}
    />
  );
}

/**
 * 過不足を符号付きの文字列にする
 * 過不足整形
 *
 * 差は「回答 − 正解」で、多く数えていれば +、足りなければ −。
 * 記号は演算子のマイナス（U+2212）で、ハイフンより横棒が長く数字と釣り合う。
 */
function formatDifference(
  { correct, user, format }: AnswerDifference,
  noDifferenceLabel: string,
): string {
  const diff = user - correct;
  if (diff === 0) return noDifferenceLabel;
  return `${diff > 0 ? "+" : "\u2212"}${format(Math.abs(diff))}`;
}
