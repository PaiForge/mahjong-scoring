import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { messages } from "@mahjong-scoring/messages/ja";

import { EMAIL_TEMPLATES, SITE_NAME } from "./contents";
import { emailTemplatePath } from "./paths";
import { renderEmailTemplate } from "./render";

/**
 * 生成物がコミット済みのファイルと一致することを固定する。
 *
 * Supabase CLI は `config.toml` の `content_path` で静的ファイルを読むため、
 * テンプレートはビルド時生成にできず、生成物をコミットして運用する。それだと
 * contents.ts / render.ts を変えて `pnpm --filter web email:generate` を忘れた
 * ときに、リポジトリの HTML と定義が黙って食い違う。ここで落とす。
 *
 * 落ちたときは `pnpm --filter web email:generate` を実行して差分をコミットする
 * （html を手で直すと次の生成で消える）。
 */
describe("認証メールテンプレート", () => {
  it.each(EMAIL_TEMPLATES.map((c) => [c.file, c] as const))(
    "%s はコミット済みの内容と一致する",
    (file, content) => {
      const committed = readFileSync(emailTemplatePath(file), "utf8");
      expect(committed).toBe(renderEmailTemplate(content));
    },
  );

  it("サイト名は 日本語辞書の metadata.siteName から引く", () => {
    // ここが空だと3通すべてが名無しのまま送られる。
    expect(SITE_NAME).not.toBe("");
    for (const content of EMAIL_TEMPLATES) {
      expect(renderEmailTemplate(content)).toContain(
        `<title>${SITE_NAME} - ${content.heading}</title>`,
      );
    }
  });

  it("Supabase が差し込むリンクのプレースホルダを残す", () => {
    // 生成時にエスケープや整形で壊すと、リンクの無いメールが送られる。
    const hrefs = Object.fromEntries(
      EMAIL_TEMPLATES.map((c) => [
        c.file,
        renderEmailTemplate(c).match(/<a href="([^"]*)"/)?.[1],
      ]),
    );
    expect(hrefs).toEqual({
      "confirmation.html":
        "{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=signup",
      "recovery.html":
        "{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=recovery",
      "email_change.html": "{{ .ConfirmationURL }}",
    });
  });

  it("確認メールの件名は config.toml・テンプレート・メール確認ページで一致する", () => {
    // メール確認ページは件名を見せて受信箱で探させる。件名を変えて画面を
    // 直し忘れると、存在しない件名を探させることになる。
    const confirmation = EMAIL_TEMPLATES.find(
      (c) => c.file === "confirmation.html",
    );
    const subject = `${SITE_NAME} - ${confirmation?.heading}`;
    const configToml = readFileSync(
      join(
        dirname(emailTemplatePath(confirmation?.file ?? "")),
        "..",
        "config.toml",
      ),
      "utf8",
    );
    const section = configToml.match(
      /\[auth\.email\.template\.confirmation\]\s*\nsubject = "([^"]*)"/,
    );
    expect(section?.[1]).toBe(subject);
    expect(messages.verifyEmail.mailSubject).toBe(subject);
  });
});
