import { getTranslations } from "next-intl/server";

interface CurriculumProgressBarProps {
  readonly readCount: number;
  readonly totalCount: number;
  readonly allCompleted: boolean;
}

/**
 * カリキュラム全体の学習進捗を示すバー。読了済章の比率を可視化する。
 * 学習進捗バー
 *
 * @param readCount 読了済みの章数
 * @param totalCount 章の総数
 * @param allCompleted 全章読了済みか
 */
export async function CurriculumProgressBar({
  readCount,
  totalCount,
  allCompleted,
}: CurriculumProgressBarProps) {
  const t = await getTranslations("learnCurriculum.index");
  const percentage =
    totalCount === 0 ? 0 : Math.round((readCount / totalCount) * 100);
  const barColorClass = allCompleted ? "bg-primary-500" : "bg-primary-400";

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-surface-600">
        <span className="font-medium">
          {t("progressLabel", { read: readCount, total: totalCount })}
        </span>
        <span className="tabular-nums">{percentage}%</span>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-200"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all ${barColorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
