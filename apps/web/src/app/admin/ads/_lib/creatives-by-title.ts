import { and, eq } from "drizzle-orm";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { adCreativeTranslations, db } from "@/lib/db";

/**
 * 既定ロケールのタイトルが `title` の広告 id（サブクエリ）
 * タイトル別広告 id
 *
 * 一括更新のアクションは画面から id の一覧を受け取らず、タイトルからその場で
 * 引き直す。画面を開いた後に足された・改題された広告も、DB の今の状態で
 * 含まれる / 外れる（`groupCreativesByTitle` 参照）。
 */
export function creativeIdsWithTitle(title: string) {
  return db
    .select({ id: adCreativeTranslations.creativeId })
    .from(adCreativeTranslations)
    .where(
      and(
        eq(adCreativeTranslations.locale, DEFAULT_LOCALE),
        eq(adCreativeTranslations.title, title),
      ),
    );
}
