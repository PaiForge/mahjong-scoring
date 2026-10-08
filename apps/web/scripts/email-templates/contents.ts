/**
 * 認証メールの本文定義
 * 認証メール本文
 *
 * Supabase が送る認証メール3通の、テンプレートごとに異なる部分だけを持つ。
 * 枠（テーブルレイアウト・インライン CSS・ヘッダー・フッター）は
 * `render.ts` の担当で、ここには文言しか置かない。
 *
 * `{{ .ConfirmationURL }}` などの二重波括弧は Supabase（Go の
 * text/template）が送信時に差し込むもので、生成時には触らずそのまま出す。
 *
 * 本番の Supabase は config.toml を読まない。テンプレートを変えたら、生成した
 * HTML をダッシュボード（Authentication > Emails）にも貼ること。
 */
import { messages } from "@mahjong-scoring/messages/ja";

/** サイト名。辞書（`@mahjong-scoring/messages`）の metadata.siteName が正典 */
export const SITE_NAME = messages.metadata.siteName;

/** 1通ぶんの可変部分 */
export interface EmailTemplateContent {
  /** `supabase/templates/` に書き出すファイル名 */
  readonly file: string;
  /**
   * 見出し。`<title>` は「サイト名 - 見出し」になる。
   *
   * `supabase/config.toml` の `subject` はこれと同じ文字列を手で持っている
   * （config.toml は Supabase CLI のものでここからは生成しない）。文言を
   * 変えたら config.toml も揃えること。
   */
  readonly heading: string;
  /** 本文。`<strong>` などの装飾を含むため HTML 断片として埋める */
  readonly body: string;
  /** ボタンのラベル */
  readonly button: string;
  /** ボタンのリンク先。Supabase のプレースホルダを含む */
  readonly href: string;
  /** ボタンの下に小さく出す注記 */
  readonly note: string;
}

/**
 * 確認メールとパスワード再設定のリンク先
 *
 * @design `ConfirmationURL` ではなく `token_hash` を web の `/auth/callback` へ渡す
 *
 * `ConfirmationURL` は Supabase の検証エンドポイントを経由し、PKCE では
 * `?code=` を付けて戻ってくる。そのコードは、登録やリセットを始めた
 * クライアントが持つ検証子（code verifier）でしか交換できない。アプリで
 * 登録した人がメールのリンクをブラウザで開くと、ブラウザには検証子が無く
 * 確認を完了できない（web でも、登録と別のブラウザで開くと同じ）。
 * `token_hash` なら `/auth/callback` が `verifyOtp` で検証でき、どこで
 * 始めたかに依存しない。
 *
 * 着地は `SiteURL`（本番の URL）に固定する。`RedirectTo` は呼び出し元が
 * 渡す値で、再設定のようにクエリを含むことがあり、そのままでは後ろに
 * パラメータを足せない。
 */
function callbackHref(type: "signup" | "recovery"): string {
  // 属性値の中の & は &amp; と書く（HTML の文字参照として読まれないように）
  return `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=${type}`;
}

/** 認証メール3通の本文 */
export const EMAIL_TEMPLATES: readonly EmailTemplateContent[] = [
  {
    file: "confirmation.html",
    heading: "メールアドレスの確認",
    body: `${SITE_NAME}へのご登録ありがとうございます。以下のボタンをクリックして、メールアドレスを確認してください。`,
    button: "メールアドレスを確認",
    href: callbackHref("signup"),
    note: "アカウントを作成した覚えがない場合は、このメールを無視してください。",
  },
  {
    file: "recovery.html",
    heading: "パスワードのリセット",
    body: "パスワードのリセットリクエストを受け付けました。以下のボタンをクリックして、新しいパスワードを設定してください。",
    button: "パスワードをリセット",
    href: callbackHref("recovery"),
    note: "パスワードのリセットをリクエストした覚えがない場合は、このメールを無視してください。パスワードは変更されません。",
  },
  {
    file: "email_change.html",
    heading: "メールアドレス変更の確認",
    body: "メールアドレスを <strong>{{ .NewEmail }}</strong> に変更するリクエストを受け付けました。以下のボタンをクリックして、変更を確認してください。",
    button: "メールアドレスの変更を確認",
    // メールアドレスの変更は画面に無く（管理側の操作だけ）、/auth/callback も
    // email_change の token_hash を扱わないので、Supabase の検証 URL のまま
    href: "{{ .ConfirmationURL }}",
    note: "この変更をリクエストした覚えがない場合は、このメールを無視してください。メールアドレスは変更されません。",
  },
];
