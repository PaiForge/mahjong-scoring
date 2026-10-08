"use client";

import { useTranslations } from "next-intl";

import { useLessonFollowUp } from "./lesson-follow-up-context";

/**
 * 級の行程の進み具合（学ぶ / 練習する / 試験）の 1 行
 * 級の進み具合
 *
 * 道場の行程カードの進み具合と同じ数え方・同じ書式。ページは静的生成なので、
 * 数は記録の Server Action が返した本人の分（`LessonFollowUp`）を読む。
 * 完了画面は記録が済んでから描かれるので、待ちは無い。返らなかった
 * （読み取りの失敗）・別のユーザーに切り替わったときは何も出さない。
 */
export function RankProgressSummary() {
  const t = useTranslations("ranks");
  const progress = useLessonFollowUp()?.rankJourneyProgress;
  if (progress === undefined) return null;

  return (
    <dl
      className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-surface-600"
      data-testid="rank-progress"
    >
      <div className="flex gap-1">
        <dt className="font-bold">{t("stages.learn")}</dt>
        <dd className="tabular-nums">
          {t("stageCount", {
            done: progress.learn.done,
            total: progress.learn.total,
          })}
        </dd>
      </div>
      <div className="flex gap-1">
        <dt className="font-bold">{t("stages.practice")}</dt>
        <dd className="tabular-nums">
          {t("stageCount", {
            done: progress.practice.done,
            total: progress.practice.total,
          })}
        </dd>
      </div>
      <div className="flex gap-1">
        <dt className="font-bold">{t("stages.exam")}</dt>
        <dd>
          {t(progress.examPassed ? "stageExamPassed" : "stageExamNotPassed")}
        </dd>
      </div>
    </dl>
  );
}
