"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

interface AnswerComparisonProps {
  /** i18n の翻訳ネームスペース（例: "totalFu"）。ラベルは `<ns>.result` から引く */
  readonly translationNamespace: string;
  /** 正解の表示内容 */
  readonly correct: ReactNode;
  /** ユーザー回答の表示内容 */
  readonly user: ReactNode;
  /** ユーザー回答が正解かどうか（回答値の文字色に反映する） */
  readonly isCorrect: boolean;
  /** 2行の上に差し込む補足（役名など）。無い練習の方が多い */
  readonly children?: ReactNode;
}

/**
 * 「正解 / あなたの回答」の対比表示
 * 回答対比
 *
 * 各練習の問題別フィードバック（{@link ProblemListAccordion} の renderDetail）で
 * 共通に使う体裁。何を正解として見せるかは練習ごとに違うので、値の組み立ては
 * 呼び出し側に任せ、ここは並べ方と正誤の色分けだけを持つ。
 */
export function AnswerComparison({
  translationNamespace,
  correct,
  user,
  isCorrect,
  children,
}: AnswerComparisonProps) {
  const tResult = useTranslations(`${translationNamespace}.result`);

  return (
    <div className="space-y-1 text-sm">
      {children}
      {/* ラベル幅を auto 列に揃え、2 行の値の左端を一致させる */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-surface-500">
        <dt className="font-medium">{tResult("correctAnswer")}:</dt>
        <dd>{correct}</dd>
        <dt className="font-medium">{tResult("yourAnswer")}:</dt>
        {/* 正誤の色は回答値だけに乗せる（ラベルは常に中立色） */}
        <dd className={isCorrect ? "text-primary-600" : "text-destructive"}>
          {user}
        </dd>
      </dl>
    </div>
  );
}
