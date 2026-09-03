import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** `apps/web/` の絶対パス */
const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * 認証メールテンプレートの書き出し先
 * メールテンプレートのパス
 *
 * 生成する側（`generate-email-templates.ts`）と、ズレを検出する側
 * （`generate-email-templates.test.ts`）が同じ場所を見るための唯一の定義。
 *
 * @param file - `supabase/templates/` 直下のファイル名
 */
export function emailTemplatePath(file: string): string {
  return join(APP_ROOT, "supabase", "templates", file);
}
