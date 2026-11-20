import { revalidatePath } from "next/cache";

import { SUPPORTED_LOCALES } from "@mahjong-scoring/features/i18n/locales";

import { internalLocalePath } from "./public-path";

/**
 * `app/[locale]` 配下のページのキャッシュを、すべての言語の分とも捨てる
 * ロケール別パス再検証
 *
 * @design 接頭辞なしのパスと、言語ごとの内部パスの両方で呼ぶ
 * ページの実体は `app/[locale]/...` にあり、日本語の公開 URL（`/lessons`）も
 * proxy が内部の `/ja/lessons` へ rewrite して描く。キャッシュの実体は内部の
 * パスにあるので、`SUPPORTED_LOCALES` を回して `internalLocalePath`
 * （`/ja/lessons`・`/en/lessons`）で捨てる。英語の画面は日本語のパスを捨てても
 * 捨てられないため、言語ごとに呼ぶ必要がある。
 * 接頭辞なしのパス（`/lessons`）で捨てたときに内部の `/ja/lessons` に効くかは
 * 確かめていないので、接頭辞なしの 1 行も残す。存在しないパスや動的なページへの
 * `revalidatePath` は何もしないだけで、両方呼んで損は無い。
 *
 * 言語を `SUPPORTED_LOCALES` から引くので、言語を足したときに呼び出し側を
 * 直さずに済む。`app/[locale]` の外のパス（`/admin/...`・`/api/...`）は渡さない —
 * 言語ごとのページが無いので、呼び出し側が `revalidatePath` を直接呼ぶ。
 *
 * @param paths - ロケール非依存のパス（`/dashboard`・`/lessons` 等）
 */
export function revalidateLocalizedPaths(paths: readonly string[]): void {
  for (const path of paths) revalidatePath(path);
  for (const locale of SUPPORTED_LOCALES) {
    for (const path of paths) revalidatePath(internalLocalePath(path, locale));
  }
}
