/**
 * Supabase の認証メールテンプレート（`supabase/templates/*.html`）を生成する。
 *
 * 3通は枠（テーブルレイアウト・インライン CSS・ヘッダー・フッター）が完全に
 * 同じで、以前はその 49 行を3ファイルにコピーし「サイト名を変えたら全部
 * 揃えること」とコメントで注意していた。枠を scripts/email-templates/render.ts、
 * 文言を同 contents.ts に分け、ここから書き出す。
 *
 * 生成物はコミットし続けること。Supabase CLI は config.toml の content_path で
 * 静的ファイルを読むため、`supabase start` の時点でファイルが要る（next build
 * より前に走るとは限らないので prebuild には載せない）。ズレは
 * scripts/email-templates/generate-email-templates.test.ts が検出する。
 *
 * 文言やサイト名を変えたら再実行すること:
 *   pnpm --filter web email:generate
 */
import { writeFileSync } from "node:fs";

import { EMAIL_TEMPLATES } from "./email-templates/contents";
import { renderEmailTemplate } from "./email-templates/render";
import { emailTemplatePath } from "./email-templates/paths";

for (const content of EMAIL_TEMPLATES) {
  const path = emailTemplatePath(content.file);
  writeFileSync(path, renderEmailTemplate(content), "utf8");
  console.log(`generated: ${path}`);
}
