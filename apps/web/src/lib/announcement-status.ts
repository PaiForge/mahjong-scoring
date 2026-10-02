/**
 * お知らせの公開状態（`announcements.status` の値）
 * 公開状態
 *
 * 管理画面の入力・検証と、公開側の一覧・詳細の絞り込みが同じ文字列を使う。
 */
export const AnnouncementStatus = {
  Draft: "draft",
  Published: "published",
} as const;
export type AnnouncementStatus =
  (typeof AnnouncementStatus)[keyof typeof AnnouncementStatus];

/** 公開状態の一覧（入力の検証と選択肢の並び） */
export const ANNOUNCEMENT_STATUSES: readonly AnnouncementStatus[] =
  Object.values(AnnouncementStatus);

/**
 * 文字列が公開状態の値か
 * 公開状態判定
 *
 * @param value - 入力された状態
 */
export function isAnnouncementStatus(
  value: string,
): value is AnnouncementStatus {
  return ANNOUNCEMENT_STATUSES.some((status) => status === value);
}
