import { useTranslations } from "next-intl";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { AnnouncementStatus } from "@/lib/announcement-status";
import { ANNOUNCEMENT_LIMITS } from "../_lib/validation";
import { ADMIN_INPUT_CLASSES } from "../../_lib/input-classes";

const inputClass = `w-full ${ADMIN_INPUT_CLASSES}`;
const labelClass = "mb-1 block text-sm font-medium text-surface-700";

/**
 * お知らせの識別の欄（slug とロケール）
 * 識別の欄
 *
 * 編集では slug を変えない（`lockSlug`）。
 */
export function AnnouncementIdentityFields({
  slug,
  locale,
  lockSlug,
  onSlugChange,
  onLocaleChange,
}: {
  readonly slug: string;
  readonly locale: string;
  readonly lockSlug: boolean;
  readonly onSlugChange: (value: string) => void;
  readonly onLocaleChange: (value: string) => void;
}) {
  const t = useTranslations("admin.announcements");
  return (
    <div className="flex flex-wrap gap-4">
      <div className="min-w-0 flex-1">
        <label className={labelClass}>{t("slug")}</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          placeholder={t("slugPlaceholder")}
          readOnly={lockSlug}
          maxLength={ANNOUNCEMENT_LIMITS.slug}
          className={`${inputClass} ${lockSlug ? "cursor-not-allowed bg-surface-100" : ""}`}
        />
      </div>
      <div className="w-32">
        <label className={labelClass}>{t("locale")}</label>
        <select
          value={locale}
          onChange={(e) => onLocaleChange(e.target.value)}
          className={inputClass}
        >
          {SUPPORTED_LOCALES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * 本文の欄（タイトルと Markdown の本文）
 * 本文の欄
 */
export function AnnouncementBodyFields({
  title,
  content,
  onTitleChange,
  onContentChange,
}: {
  readonly title: string;
  readonly content: string;
  readonly onTitleChange: (value: string) => void;
  readonly onContentChange: (value: string) => void;
}) {
  const t = useTranslations("admin.announcements");
  return (
    <>
      <div>
        <label className={labelClass}>{t("title")}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t("titlePlaceholder")}
          maxLength={ANNOUNCEMENT_LIMITS.title}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>{t("content")}</label>
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={t("contentPlaceholder")}
          rows={16}
          className={`${inputClass} resize-y font-mono`}
        />
      </div>
    </>
  );
}

/**
 * 公開の欄（状態・公開日時・ピン留め）
 * 公開の欄
 *
 * 公開日時は JST の壁時計のまま持ち、瞬間への変換はサーバーに任せる
 * （ブラウザで `new Date()` に通すと端末のタイムゾーンで読まれる）。
 */
export function AnnouncementPublishFields({
  status,
  publishedAtLocal,
  pinned,
  onStatusChange,
  onPublishedAtChange,
  onPinnedChange,
}: {
  readonly status: string;
  readonly publishedAtLocal: string;
  readonly pinned: boolean;
  readonly onStatusChange: (value: string) => void;
  readonly onPublishedAtChange: (value: string) => void;
  readonly onPinnedChange: (value: boolean) => void;
}) {
  const t = useTranslations("admin.announcements");
  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-40">
          <label className={labelClass}>{t("status")}</label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className={inputClass}
          >
            <option value={AnnouncementStatus.Draft}>{t("statusDraft")}</option>
            <option value={AnnouncementStatus.Published}>
              {t("statusPublished")}
            </option>
          </select>
        </div>
        <div className="min-w-0 flex-1">
          <label className={labelClass}>{t("publishedAtInput")}</label>
          <input
            type="datetime-local"
            value={publishedAtLocal}
            onChange={(e) => onPublishedAtChange(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-surface-700">
        <input
          type="checkbox"
          checked={pinned}
          onChange={(e) => onPinnedChange(e.target.checked)}
          className="size-4 rounded border-surface-300"
        />
        {t("pinned")}
        <span className="text-xs text-surface-400">{t("pinnedHint")}</span>
      </label>
    </>
  );
}
