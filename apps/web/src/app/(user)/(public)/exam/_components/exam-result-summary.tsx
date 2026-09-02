import { getTranslations } from "next-intl/server";

import type { ExamOutcomeInput } from "../_lib/exam-outcome";
import { evaluateExamOutcome } from "../_lib/exam-outcome";

/** 秒を小数 1 桁で出す（"7.5"）。ロケールを跨いでも桁が揺れないよう固定 */
function formatSeconds(seconds: number): string {
  return seconds.toFixed(1);
}

/**
 * 昇級試験の結果サマリ（合否・合格ラインとの差・ペース）
 * 試験結果サマリ
 *
 * 練習の `ResultScoreBar`（正解 / 不正解の積み上げ棒）の代わりに「結果」節に
 * 載せる。試験はミス 1 回で終了するため不正解は常に 0 か 1 で、割合の
 * 棒グラフが伝える情報は「誤答で終わったか時間切れか」の 1 ビットしかない。
 * それは文字で書く。
 *
 * 合否を主役にし、不合格のときは「あと N 問」を同じ重さで併記する。合格
 * ラインが画面に無いと、正解数だけ見せられても受かったのか分からないため。
 * 判定と診断の分岐は {@link evaluateExamOutcome} が持つ。
 *
 * 配色は回答フィードバックと同じ success / destructive を使う。合格・不合格は
 * 正誤の延長線上にある知らせで、別の色を導入しない。
 */
export async function ExamResultSummary(input: ExamOutcomeInput) {
  const t = await getTranslations("examResult");
  const outcome = evaluateExamOutcome(input);
  const { correct, total, minScore } = input;

  return (
    <div className="space-y-4">
      <div
        className={`rounded-xl border-3 p-5 text-center ${
          outcome.passed
            ? "border-success bg-success-subtle text-success-strong"
            : "border-destructive bg-destructive-subtle text-destructive-strong"
        }`}
      >
        <p className="text-2xl font-bold">
          {outcome.passed ? t("pass") : t("fail")}
        </p>
        <p className="mt-1 text-sm">{t("scoreLine", { correct, minScore })}</p>
        {!outcome.passed && (
          <p className="mt-2 text-lg font-bold">
            {t("remaining", { count: outcome.remaining })}
          </p>
        )}
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-surface-600">{t("correctLabel")}</dt>
          <dd className="font-semibold text-surface-900">
            {t("correctValue", { count: correct })}
          </dd>
        </div>
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

      <p className="text-xs text-surface-500">
        {outcome.ending === "mistake"
          ? t("endedByMistake", { n: total })
          : t("endedByTime")}
      </p>
    </div>
  );
}
