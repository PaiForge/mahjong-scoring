import { SITE_NAME, type EmailTemplateContent } from "./contents";

/**
 * 認証メールの共通レイアウト
 * 認証メールレイアウト
 *
 * メールクライアントは外部 CSS も `<style>` も落とすため、テーブルレイアウトと
 * インライン CSS で組む。この枠は3通で完全に同じで、以前は 49 行を3ファイルに
 * コピーしていた。文言だけを {@link EmailTemplateContent} で受け取り、枠は
 * ここ1箇所に持つ。
 *
 * 出力は `supabase/templates/*.html` へそのまま書き出される。生成物は
 * リポジトリにコミットし続けること — Supabase CLI は `config.toml` の
 * `content_path` で静的ファイルを読むため、`supabase start` の時点で
 * ファイルが無いと起動できない。
 *
 * @param content - そのテンプレート固有の文言
 */
export function renderEmailTemplate(content: EmailTemplateContent): string {
  return `<!-- このファイルは scripts/generate-email-templates.ts の生成物。直接編集せず、文言は scripts/email-templates/contents.ts を変えて \`pnpm --filter web email:generate\` で作り直すこと -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${SITE_NAME} - ${content.heading}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; max-width: 480px;">
            <tr>
              <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e5e5e5;">
                <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #1a1a1a;">${SITE_NAME}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #1a1a1a;">${content.heading}</h2>
                <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #444444;">
                  ${content.body}
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding: 8px 0;">
                      <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 12px 32px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 500; border-radius: 6px;">
                        ${content.button}
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.6; color: #888888;">
                  ${content.note}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 32px; border-top: 1px solid #e5e5e5; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #aaaaaa;">${SITE_NAME}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}
