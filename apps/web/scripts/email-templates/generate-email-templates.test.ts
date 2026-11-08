import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages } from "@mahjong-scoring/messages/ja";

import { EMAIL_TEMPLATES, SITE_NAME, emailSubject } from "./contents";
import { emailTemplatePath } from "./paths";
import { renderEmailTemplate } from "./render";

/** `supabase/config.toml` の中身 */
function readConfigToml(): string {
  return readFileSync(
    join(dirname(emailTemplatePath("confirmation.html")), "..", "config.toml"),
    "utf8",
  );
}

/** config.toml の `[auth.email.template.<name>]` の subject */
function configSubject(configToml: string, name: string): string | undefined {
  return configToml.match(
    new RegExp(
      `\\[auth\\.email\\.template\\.${name}\\]\\s*\\nsubject = "([^"]*)"`,
    ),
  )?.[1];
}

/** 描いたテンプレートの `<a href>` を出てくる順に */
function hrefs(html: string): string[] {
  return [...html.matchAll(/<a href="([^"]*)"/g)].map((m) => m[1] ?? "");
}

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

  it("サイト名は 日本語辞書の metadata.siteName から引き、件名は日英の見出しを併記する", () => {
    // ここが空だと3通すべてが名無しのまま送られる。
    expect(SITE_NAME).not.toBe("");
    for (const content of EMAIL_TEMPLATES) {
      const subject = `${SITE_NAME} - ${content.ja.heading} / ${content.en.heading}`;
      expect(emailSubject(content)).toBe(subject);
      expect(renderEmailTemplate(content)).toContain(
        `<title>${subject}</title>`,
      );
    }
  });

  it("日本語の段 → 英語の段の順に、両方の文言を描く", () => {
    for (const content of EMAIL_TEMPLATES) {
      const html = renderEmailTemplate(content);
      const ja = html.indexOf(`<td lang="ja"`);
      const en = html.indexOf(`<td lang="en"`);
      expect(ja).toBeGreaterThan(-1);
      expect(en).toBeGreaterThan(ja);
      for (const [lang, copy] of [
        ["ja", content.ja],
        ["en", content.en],
      ] as const) {
        for (const text of [copy.heading, copy.body, copy.button, copy.note]) {
          expect(text, `${content.file} の ${lang}`).not.toBe("");
          expect(html).toContain(text);
        }
      }
    }
  });

  it("英語の文言に日本語（かな・漢字）を混ぜない", () => {
    for (const content of EMAIL_TEMPLATES) {
      const { heading, body, button, note } = content.en;
      for (const text of [heading, body, button, note]) {
        expect(text, content.file).not.toMatch(/[぀-ヿ一-鿿]/);
      }
    }
  });

  it("ボタンは 2 つ。日本語は locale 無し、英語は &amp;locale=en で、Supabase のプレースホルダを残す", () => {
    // 生成時にエスケープや整形で壊すと、リンクの無いメールが送られる。
    const actual = Object.fromEntries(
      EMAIL_TEMPLATES.map((c) => [c.file, hrefs(renderEmailTemplate(c))]),
    );
    const base = "{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}";
    expect(actual).toEqual({
      "confirmation.html": [
        `${base}&amp;type=signup`,
        `${base}&amp;type=signup&amp;locale=en`,
      ],
      "recovery.html": [
        `${base}&amp;type=recovery`,
        `${base}&amp;type=recovery&amp;locale=en`,
      ],
      "email_change.html": [
        `${base}&amp;type=email_change`,
        `${base}&amp;type=email_change&amp;locale=en`,
      ],
    });
  });

  it("3 通の件名は config.toml の subject と一致する", () => {
    const configToml = readConfigToml();
    const sections: Readonly<Record<string, string>> = {
      "confirmation.html": "confirmation",
      "recovery.html": "recovery",
      "email_change.html": "email_change",
    };
    for (const content of EMAIL_TEMPLATES) {
      expect(configSubject(configToml, sections[content.file] ?? "")).toBe(
        emailSubject(content),
      );
    }
  });

  it("確認メールの件名は config.toml・テンプレート・メール確認ページ（日英）で一致する", () => {
    // メール確認ページは件名を見せて受信箱で探させる。件名を変えて画面を
    // 直し忘れると、存在しない件名を探させることになる。届くメールは 1 通で
    // 日英を併記するので、英語のページも同じ件名を見せる。
    const confirmation = EMAIL_TEMPLATES.find(
      (c) => c.file === "confirmation.html",
    );
    expect(confirmation).toBeDefined();
    if (confirmation === undefined) return;
    const subject = emailSubject(confirmation);
    expect(configSubject(readConfigToml(), "confirmation")).toBe(subject);
    expect(messages.verifyEmail.mailSubject).toBe(subject);
    expect(enMessages.verifyEmail.mailSubject).toBe(subject);
  });
});
