"use client";

import { useTranslations } from "next-intl";

interface ResultScoreBarProps {
  readonly correct: number;
  readonly total: number;
}

/**
 * 練習結果のスコアを正解/不正解の積み上げ棒グラフで表示する
 * 結果スコアバー
 *
 * 旧 `27 / 28` 形式のテキスト表示に代わる視覚表現。
 * セグメント幅は割合で計算し、各セグメント内に件数を表示する。
 * 凡例（正解/不正解）と正答率テキストもあわせて表示する。
 */
export function ResultScoreBar({ correct, total }: ResultScoreBarProps) {
  const tc = useTranslations("challenge");
  const safeTotal = Math.max(total, 0);
  const safeCorrect = Math.max(Math.min(correct, safeTotal), 0);
  const incorrect = safeTotal - safeCorrect;
  const correctPercent = safeTotal > 0 ? (safeCorrect / safeTotal) * 100 : 0;
  const incorrectPercent = safeTotal > 0 ? (incorrect / safeTotal) * 100 : 0;
  const accuracy = safeTotal > 0 ? Math.round((safeCorrect / safeTotal) * 100) : 0;

  return (
    <div className="w-full">
      <div
        className="flex h-8 w-full overflow-hidden rounded-md bg-surface-100"
        role="img"
        aria-label={tc("resultAccuracy", { accuracy })}
      >
        {safeCorrect > 0 && (
          <div
            className="flex items-center justify-center bg-primary-500 text-sm font-semibold text-white"
            style={{ width: `${correctPercent}%` }}
          >
            {safeCorrect}
          </div>
        )}
        {incorrect > 0 && (
          <div
            className="flex items-center justify-center bg-red-500 text-sm font-semibold text-white"
            style={{ width: `${incorrectPercent}%` }}
          >
            {incorrect}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-surface-600">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-primary-500" aria-hidden="true" />
            {tc("correct")}: <span className="font-semibold text-surface-800">{safeCorrect}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-red-500" aria-hidden="true" />
            {tc("incorrect")}: <span className="font-semibold text-surface-800">{incorrect}</span>
          </span>
        </div>
        <span className="font-semibold text-surface-800">
          {tc("resultAccuracy", { accuracy })}
        </span>
      </div>
    </div>
  );
}
