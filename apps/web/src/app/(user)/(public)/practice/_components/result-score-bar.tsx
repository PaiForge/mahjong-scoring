import { getTranslations } from "next-intl/server";
import { scoreBarFigures } from "@mahjong-scoring/features/results/score-bar";
import { RevealMistakesLink } from "./reveal-mistakes-link";

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
 *
 * 凡例の「不正解: N」は、押すと下の問題別一覧で間違えた問題を開いてそこへ
 * 送るリンクになる（{@link RevealMistakesLink}）。不正解が 0 のときは送る先が
 * 無いので文字のまま。
 */
export async function ResultScoreBar({ correct, total }: ResultScoreBarProps) {
  const tc = await getTranslations("challenge");
  const {
    correct: safeCorrect,
    incorrect,
    total: safeTotal,
    accuracy,
  } = scoreBarFigures(correct, total);
  const correctPercent = safeTotal > 0 ? (safeCorrect / safeTotal) * 100 : 0;
  const incorrectPercent = safeTotal > 0 ? (incorrect / safeTotal) * 100 : 0;
  const incorrectLabel = (
    <>
      {tc("incorrect")}:{" "}
      <span className="font-semibold text-surface-800">{incorrect}</span>
    </>
  );

  return (
    <div className="w-full space-y-3">
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
            className="flex items-center justify-center bg-destructive text-sm font-semibold text-white"
            style={{ width: `${incorrectPercent}%` }}
          >
            {incorrect}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-surface-600">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className="size-3 rounded-sm bg-primary-500"
              aria-hidden="true"
            />
            {tc("correct")}:{" "}
            <span className="font-semibold text-surface-800">
              {safeCorrect}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="size-3 rounded-sm bg-destructive"
              aria-hidden="true"
            />
            {incorrect > 0 ? (
              <RevealMistakesLink>{incorrectLabel}</RevealMistakesLink>
            ) : (
              incorrectLabel
            )}
          </span>
        </div>
        <span className="font-semibold text-surface-800">
          {tc("resultAccuracy", { accuracy })}
        </span>
      </div>
    </div>
  );
}
