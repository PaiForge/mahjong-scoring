"use client";

import { useTranslations } from "next-intl";

import { roundedPercent } from "@mahjong-scoring/features/percent";

import { useLessonProgress } from "./lesson-progress-provider";

export interface CurriculumProgressBarViewProps {
  /** 完了したレッスンの数 */
  readonly completedCount: number;
  /** レッスンの総数 */
  readonly totalCount: number;
  /** すべて完了したか */
  readonly allCompleted: boolean;
}

/**
 * 学習進捗バーを描く（クライアント）
 * 学習進捗バービュー
 *
 * `/lessons` の {@link LessonProgressScope} が本人の完了を取り終えていれば、
 * その範囲で数えた完了数・分母・すべて完了を使い、無ければ props
 * （静的 HTML のゲストの状態・ダッシュボードがサーバーで数えた値）を使う。
 * 分母はその言語で出しているレッスンの数（英語の目次で日本語だけの章を
 * 数えない）。
 */
export function CurriculumProgressBarView(
  props: CurriculumProgressBarViewProps,
) {
  const t = useTranslations("learnCurriculum.index");
  const progress = useLessonProgress();
  const { completedCount, totalCount, allCompleted } =
    progress === undefined
      ? props
      : {
          completedCount: progress.completedCount,
          totalCount: progress.totalCount,
          allCompleted: progress.nextSlug === undefined,
        };
  const percentage = roundedPercent(completedCount, totalCount);
  const barColorClass = allCompleted ? "bg-success" : "bg-success/70";
  const label = t("progressLabel", { done: completedCount, total: totalCount });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-surface-600">
        <span className="font-bold">{label}</span>
        <span className="tabular-nums">{percentage}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface-100"
        role="progressbar"
        aria-label={label}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-[width] motion-reduce:transition-none ${barColorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
