import { useTranslations } from "next-intl";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/i18n/locales";
import { AD_CREATIVE_LIMITS } from "../_lib/validation";
import { AD_FORM_INPUT_CLASS, AD_FORM_LABEL_CLASS } from "./ad-form-classes";

/**
 * 文言の欄（ロケールごとのタイトルと説明）
 * 文言の欄
 *
 * 既定ロケールのタイトルは必須、他は任意（見出しに添える）。
 */
export function AdCopyFields({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: {
  readonly title: Readonly<Record<string, string>>;
  readonly description: Readonly<Record<string, string>>;
  readonly onTitleChange: (locale: string, value: string) => void;
  readonly onDescriptionChange: (locale: string, value: string) => void;
}) {
  const t = useTranslations("admin.ads");
  return SUPPORTED_LOCALES.map((locale) => (
    <fieldset
      key={locale}
      className="space-y-3 rounded border border-surface-200 p-4"
    >
      <legend className="px-1 text-sm font-semibold text-surface-800">
        {t("copyHeading", { locale })}
        <span className="ml-2 text-xs font-normal text-surface-400">
          {locale === DEFAULT_LOCALE ? t("copyRequired") : t("copyOptional")}
        </span>
      </legend>
      <div>
        <label htmlFor={`ad-title-${locale}`} className={AD_FORM_LABEL_CLASS}>
          {t("copyTitle")}
        </label>
        <input
          id={`ad-title-${locale}`}
          type="text"
          value={title[locale] ?? ""}
          onChange={(e) => onTitleChange(locale, e.target.value)}
          maxLength={AD_CREATIVE_LIMITS.title}
          className={AD_FORM_INPUT_CLASS}
        />
      </div>
      <div>
        <label
          htmlFor={`ad-description-${locale}`}
          className={AD_FORM_LABEL_CLASS}
        >
          {t("copyDescription")}
        </label>
        <textarea
          id={`ad-description-${locale}`}
          value={description[locale] ?? ""}
          onChange={(e) => onDescriptionChange(locale, e.target.value)}
          maxLength={AD_CREATIVE_LIMITS.description}
          rows={3}
          className={`${AD_FORM_INPUT_CLASS} resize-y`}
        />
      </div>
    </fieldset>
  ));
}
