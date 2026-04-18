import { getTranslations } from "next-intl/server";

interface ChapterProgressBadgeProps {
  readonly isRead: boolean;
}

/**
 * 章の読了状態を示すバッジ。未読の場合は何も描画しない。
 * 読了済バッジ
 */
export async function ChapterProgressBadge({ isRead }: ChapterProgressBadgeProps) {
  if (!isRead) return undefined;
  const t = await getTranslations("learnCurriculum.chapter");
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
      {t("markedAsRead")}
    </span>
  );
}
