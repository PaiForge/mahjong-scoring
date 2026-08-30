"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { DetailTable } from "./detail-table";

interface AnswerComparisonProps {
  /** i18n の翻訳ネームスペース（例: "totalFu"）。ラベルは `<ns>.result` から引く */
  readonly translationNamespace: string;
  /** 正解の表示内容 */
  readonly correct: ReactNode;
  /** ユーザー回答の表示内容 */
  readonly user: ReactNode;
  /** ユーザー回答が正解かどうか（回答値の文字色に反映する） */
  readonly isCorrect: boolean;
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
 * 同じ形（白カードの中の名前と値の表）にして、詳細の中で見た目を割らない。
 */
export function AnswerComparison({
  translationNamespace,
  correct,
  user,
  isCorrect,
}: AnswerComparisonProps) {
  const tResult = useTranslations(`${translationNamespace}.result`);
  const tCommon = useTranslations("common");

  return (
    <DetailTable
      title={tCommon("answerCheck")}
      rows={[
        { label: tResult("correctAnswer"), value: correct },
        {
          label: tResult("yourAnswer"),
          value: user,
          // 正誤の色は回答値だけに乗せる（ラベルは常に中立色）
          tone: isCorrect ? "correct" : "incorrect",
        },
      ]}
    />
  );
}
