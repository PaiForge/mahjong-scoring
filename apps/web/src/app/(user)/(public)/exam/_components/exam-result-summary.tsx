import { getTranslations } from "next-intl/server";

import type { ExamOutcomeInput } from "@mahjong-scoring/features/exam/exam-outcome";
import { evaluateExamOutcome } from "@mahjong-scoring/features/exam/exam-outcome";
import { RevealMistakesLink } from "@/app/(user)/(public)/practice/_components/reveal-mistakes-link";

/** 秒を小数 1 桁で出す（"7.5"）。ロケールを跨いでも桁が揺れないよう固定 */
function formatSeconds(seconds: number): string {
  return seconds.toFixed(1);
}

/**
 * 昇級試験の結果サマリ（合否・合格ラインまでの進み具合・ペース）
 * 試験結果サマリ
 *
 * 練習の `ResultScoreBar`（正解 / 不正解の積み上げ棒）の代わりに「結果」節に
 * 載せる。形は練習にそろえる — 高さ 8 の棒、その下に凡例と右端の 1 項目。
 * 以前は合否を色付きの大きな枠で出していたが、結果画面の最初の 1 画面を
 * 取りすぎ、練習の結果と見た目の言葉も違っていた。
 *
 * ただし棒の意味は練習と変える。試験はミス 1 回で終了するため不正解は常に
 * 0 か 1 で、正解 / 不正解の比率は「誤答で終わったか時間切れか」の 1 ビット
 * しか伝えない。代わりに棒の全長を合格ラインにして正解数を埋める。
 * 「あとどれだけ足りなかったか」が長さで見える。試験は合格ラインに届いた
 * 時点で終わるので、合格なら棒はちょうど満ちる。
 *
 * 合否は棒の上の 1 行で言い、不合格のときは「あと N 問」を同じ行に並べる。
 * 配色は回答フィードバックと同じ success / destructive を使う。合格・不合格は
 * 正誤の延長線上にある知らせで、別の色を導入しない。
 *
 * 凡例の右端は終わり方。誤答・時間切れで終わったときは、押すと問題別一覧で
 * その問題を開いて送るリンクになる（{@link RevealMistakesLink}）。練習の
 * 「不正解: N」と同じ導線で、試験では終わらせた 1 問がそれに当たる。
 * 判定と診断の分岐は {@link evaluateExamOutcome} が持つ。
 */
export async function ExamResultSummary(input: ExamOutcomeInput) {
  const t = await getTranslations("examResult");
  const outcome = evaluateExamOutcome(input);
  const { correct, total, minScore } = input;
  // 合格ラインに届いた時点で終わるので correct ≤ minScore だが、正解数は
  // URL から来るため、それを超えていてもはみ出さないよう大きい方を全長にする
  const barLength = Math.max(minScore, correct, 1);
  const correctPercent = (Math.max(correct, 0) / barLength) * 100;

  const endingLabel =
    outcome.ending === "goal"
      ? t("endedByGoal")
      : outcome.ending === "mistake"
        ? t("endedByMistake", { n: total })
        : t("endedByTime");

  return (
    <div className="w-full space-y-3">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={`text-xl font-bold ${
            outcome.passed ? "text-success-strong" : "text-destructive-strong"
          }`}
        >
          {outcome.passed ? t("pass") : t("fail")}
        </span>
        {!outcome.passed && (
          <span className="text-sm font-semibold text-destructive-strong">
            {t("remaining", { count: outcome.remaining })}
          </span>
        )}
      </p>

      <div
        className="flex h-8 w-full overflow-hidden rounded-md bg-surface-100"
        role="img"
        aria-label={t("scoreLine", { correct, minScore })}
      >
        {correct > 0 && (
          <div
            className="flex items-center justify-center bg-primary-500 text-sm font-semibold text-white"
            style={{ width: `${correctPercent}%` }}
          >
            {correct}
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
            {t("correctLegend")}:{" "}
            <span className="font-semibold text-surface-800">{correct}</span>
          </span>
          <span>
            {t("minScoreLegend")}:{" "}
            <span className="font-semibold text-surface-800">{minScore}</span>
          </span>
        </div>
        {outcome.ending === "goal" ? (
          <span>{endingLabel}</span>
        ) : (
          <RevealMistakesLink>{endingLabel}</RevealMistakesLink>
        )}
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-surface-600">{t("averageTimeLabel")}</dt>
          <dd className="font-semibold text-surface-900">
            {outcome.averageSeconds === undefined
              ? t("averageTimeNone")
              : t("averageTimeValue", {
                  seconds: formatSeconds(outcome.averageSeconds),
                })}
          </dd>
        </div>
        {outcome.showRequiredPace && (
          <div className="flex items-center justify-between">
            <dt className="text-surface-600">{t("requiredPaceLabel")}</dt>
            <dd className="font-semibold text-surface-900">
              {t("requiredPaceValue", {
                seconds: formatSeconds(outcome.requiredPaceSeconds),
              })}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
