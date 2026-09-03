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
 */
import messages from "../../src/messages/ja.json";

/** サイト名。`src/messages/ja.json` の metadata.siteName が正典 */
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
  /** ボタンの下に小さく出す注記 */
  readonly note: string;
}

/** 認証メール3通の本文 */
export const EMAIL_TEMPLATES: readonly EmailTemplateContent[] = [
  {
    file: "confirmation.html",
    heading: "メールアドレスの確認",
    body: `${SITE_NAME}へのご登録ありがとうございます。以下のボタンをクリックして、メールアドレスを確認してください。`,
    button: "メールアドレスを確認",
    note: "アカウントを作成した覚えがない場合は、このメールを無視してください。",
  },
  {
    file: "recovery.html",
    heading: "パスワードのリセット",
    body: "パスワードのリセットリクエストを受け付けました。以下のボタンをクリックして、新しいパスワードを設定してください。",
    button: "パスワードをリセット",
    note: "パスワードのリセットをリクエストした覚えがない場合は、このメールを無視してください。パスワードは変更されません。",
  },
  {
    file: "email_change.html",
    heading: "メールアドレス変更の確認",
    body: "メールアドレスを <strong>{{ .NewEmail }}</strong> に変更するリクエストを受け付けました。以下のボタンをクリックして、変更を確認してください。",
    button: "メールアドレスの変更を確認",
    note: "この変更をリクエストした覚えがない場合は、このメールを無視してください。メールアドレスは変更されません。",
  },
];
