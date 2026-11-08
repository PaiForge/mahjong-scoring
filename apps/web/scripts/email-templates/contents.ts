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
 * HTML と件名をダッシュボード（Authentication > Emails > Templates）にも貼ること
 * （手順は `docs/resend-smtp-setup.md`）。
 *
 * @design 1 通のメールに日本語と英語を併記する
 *
 * 件名は「<サイト名> - <日本語の見出し> / <英語の見出し>」、本文は日本語の段落の
 * 後に英語の段落、ボタンは日本語（`locale` 無し → 日本語のページに着く）と英語
 * （`&locale=en` → `/auth/callback` が英語のページに着かせる）の 2 つ。
 *
 * - 言語別にテンプレートを送り分ける仕組みは作らない。Supabase は言語別の
 *   テンプレートを持たず、送り分けるには登録時の言語を user metadata に残して
 *   テンプレートの中で分岐させる等の仕組みが要る。iOS のアプリの登録・
 *   パスワードの再設定も同じ 3 通を受けるので、併記なら英語の端末の利用者にも読める
 * - 英語の文言は `@mahjong-scoring/messages` の辞書ではなくここに直接持つ。
 *   テンプレートは生成物で画面に出ず、辞書の完訳の検査（`en.test.ts`）の対象外。
 *   サイト名だけは辞書（`metadata.siteName`）を正典にする
 * - 日本語のボタンに `locale=ja` を付けないのは、`locale` 無しを日本語として扱う
 *   コールバックの規則のままで足り、旧い形のリンクと同じ着地になるため
 */
import { messages } from "@mahjong-scoring/messages/ja";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/** サイト名。辞書（`@mahjong-scoring/messages`）の metadata.siteName が正典 */
export const SITE_NAME = messages.metadata.siteName;

/** `/auth/callback` が `token_hash` で検証するメールの種類 */
export type EmailCallbackType = "signup" | "recovery" | "email_change";

/** 1 言語ぶんの文言 */
export interface EmailCopy {
  /** 見出し。件名と `<title>` にも使う（{@link emailSubject}） */
  readonly heading: string;
  /** 本文。`<strong>` などの装飾を含むため HTML 断片として埋める */
  readonly body: string;
  /** ボタンのラベル */
  readonly button: string;
  /** ボタンの下に小さく出す注記 */
  readonly note: string;
}

/** 1通ぶんの可変部分 */
export interface EmailTemplateContent {
  /** `supabase/templates/` に書き出すファイル名 */
  readonly file: string;
  /** ボタンのリンク先の種類（{@link callbackHref}） */
  readonly type: EmailCallbackType;
  /** 日本語の文言（先に出す） */
  readonly ja: EmailCopy;
  /** 英語の文言（日本語の後に出す） */
  readonly en: EmailCopy;
}

/**
 * メールの件名（`<title>` も同じ）
 * 認証メール件名
 *
 * `supabase/config.toml` の `subject` と本番の Dashboard の Subject はこれと同じ
 * 文字列を手で持っている（config.toml は Supabase CLI のものでここからは生成しない）。
 * 確認メールの件名は、メール確認待ちのページも辞書（`verifyEmail.mailSubject`）で
 * 見せている。文言を変えたらそれらも揃えること（`generate-email-templates.test.ts` が
 * 食い違いを落とす）。
 */
export function emailSubject(content: EmailTemplateContent): string {
  return `${SITE_NAME} - ${content.ja.heading} / ${content.en.heading}`;
}

/**
 * 確認メール・パスワード再設定・メールアドレス変更のリンク先
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
 * パラメータを足せない。そのため着地の言語も `RedirectTo` からは運ばず、
 * ボタンごとに `locale` を付ける（既定の言語のボタンは付けない）。
 *
 * @param type - メールの種類
 * @param locale - そのボタンの着地の言語（省略時は日本語。`locale` を付けない）
 */
export function callbackHref(
  type: EmailCallbackType,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  // 属性値の中の & は &amp; と書く（HTML の文字参照として読まれないように）
  const base = `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=${type}`;
  return locale === DEFAULT_LOCALE ? base : `${base}&amp;locale=${locale}`;
}

/** 認証メール3通の本文 */
export const EMAIL_TEMPLATES: readonly EmailTemplateContent[] = [
  {
    file: "confirmation.html",
    type: "signup",
    ja: {
      heading: "メールアドレスの確認",
      body: `${SITE_NAME}へのご登録ありがとうございます。以下のボタンをクリックして、メールアドレスを確認してください。`,
      button: "メールアドレスを確認",
      note: "アカウントを作成した覚えがない場合は、このメールを無視してください。",
    },
    en: {
      heading: "Confirm your email address",
      body: "Thank you for signing up. Click the button below to confirm your email address.",
      button: "Confirm email address",
      note: "If you didn't create an account, you can ignore this email.",
    },
  },
  {
    file: "recovery.html",
    type: "recovery",
    ja: {
      heading: "パスワードのリセット",
      body: "パスワードのリセットリクエストを受け付けました。以下のボタンをクリックして、新しいパスワードを設定してください。",
      button: "パスワードをリセット",
      note: "パスワードのリセットをリクエストした覚えがない場合は、このメールを無視してください。パスワードは変更されません。",
    },
    en: {
      heading: "Reset your password",
      body: "We received a request to reset your password. Click the button below to set a new password.",
      button: "Reset password",
      note: "If you didn't request a password reset, you can ignore this email. Your password won't be changed.",
    },
  },
  {
    file: "email_change.html",
    // 変更前・変更後の両方のアドレスに届く（double_confirm_changes）。
    // 両方のリンクを開くと変更が確定する。文面は 2 通で同じ
    type: "email_change",
    ja: {
      heading: "メールアドレス変更の確認",
      body: "メールアドレスを <strong>{{ .NewEmail }}</strong> に変更するリクエストを受け付けました。以下のボタンをクリックして、変更を確認してください。",
      button: "メールアドレスの変更を確認",
      note: "この変更をリクエストした覚えがない場合は、このメールを無視してください。メールアドレスは変更されません。",
    },
    en: {
      heading: "Confirm your email address change",
      body: "We received a request to change your email address to <strong>{{ .NewEmail }}</strong>. Click the button below to confirm the change.",
      button: "Confirm email change",
      note: "If you didn't request this change, you can ignore this email. Your email address won't be changed.",
    },
  },
];
