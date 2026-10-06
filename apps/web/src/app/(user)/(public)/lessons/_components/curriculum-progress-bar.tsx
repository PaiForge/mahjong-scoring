import { getTranslations } from "next-intl/server";
import { roundedPercent } from "@mahjong-scoring/features/percent";

interface CurriculumProgressBarProps {
  readonly completedCount: number;
  readonly totalCount: number;
  readonly allCompleted: boolean;
}

/**
 * カリキュラム全体の学習進捗を示すバー。完了したレッスンの比率を可視化する。
 * 学習進捗バー
 *
 * @param completedCount 完了したレッスンの数
 * @param totalCount レッスンの総数
 * @param allCompleted すべて完了したか
 */
export async function CurriculumProgressBar({
  completedCount,
  totalCount,
  allCompleted,
}: CurriculumProgressBarProps) {
  const t = await getTranslations("learnCurriculum.index");
  const percentage = roundedPercent(completedCount, totalCount);
  const barColorClass = allCompleted ? "bg-primary-500" : "bg-primary-400";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-surface-600">
        <span className="font-bold">
          {t("progressLabel", { done: completedCount, total: totalCount })}
        </span>
        <span className="tabular-nums">{percentage}%</span>
      </div>
      <div
        className="h-4 w-full overflow-hidden rounded-full border-3 border-ink bg-surface-200"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-l-full transition-all ${barColorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
