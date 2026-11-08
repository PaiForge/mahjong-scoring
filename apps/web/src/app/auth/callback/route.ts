import { NextResponse } from "next/server";

import { resolvePublishedHref } from "@/i18n/navigation";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";
import { getOptionalUser } from "@/lib/auth";
import { logActivityEvent } from "@/lib/activity-log";
import { getProfileByUserId } from "@/lib/db/queries";
import { buildSignInHref, sanitizeInternalRedirect } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";
import {
  LINK_RETURN_GOOGLE,
  LINK_RETURN_PARAM,
  accountPageHref,
} from "@/lib/users/account-page-notice";

/**
 * 認証コールバックハンドラ。
 *
 * 6種類のコールバックを処理する:
 * 1. OAuth `code` — 認可コードをセッションに交換する（既存フロー）
 * 2. `code` + `type=recovery` — PKCE リカバリフロー、コード交換後パスワードリセットへ
 * 3. `token_hash` + `type=signup` — メール確認 OTP の検証（PKCE フロー）
 * 4. `token_hash` + `type=recovery` — パスワードリカバリ OTP の検証
 * 5. `token_hash` + `type=email_change` — メールアドレス変更の確認。変更前・変更後の
 *    2 通のリンクが両方ここへ来る。1 通目は認証サーバーがセッションを出さずに
 *    「受け付けた」と返し、2 通目で変更が確定してセッションが出る
 * 6. `link=google` + `code` / `error_code` — アカウントのページの「Google アカウントを
 *    追加」（`linkIdentity`）の戻り。ログインの着地ではなくアカウントのページへ、
 *    結果の報せ（`accountPageHref`）を付けて送る
 *
 * Note: ログインセッションはユーザー名設定前にここで確立される。
 * OAuth の認可コードは使い捨てかつ短命であるため、即座に交換しないと
 * ユーザーの identity を失う。プロフィール未作成ユーザーは
 * setup-username ページにリダイレクトし、confirmed レイアウトガードが
 * オンボーディング完了まで他ページへのアクセスを防ぐ。
 *
 * ## 着地の言語（`locale` の query）
 *
 * このルートは `app/[locale]` の外にあり（`/en/auth/callback` は無い。proxy の
 * `isNonLocalizedPath` がロケール化しない）、URL から言語を知れない。そこで入口
 * — OAuth の `redirectTo`（Google のボタン・Google の追加）、認証メールのボタン、
 * パスワードの再設定の `redirectTo` — が、英語のときだけ `locale=en` を付け、
 * ここで {@link readCallbackLocale} が検証する（無効・無ければ日本語）。日本語の
 * 入口は `locale` を付けず、戻り先の文字列を従来のままにする（日本語の挙動と、
 * 本番の Supabase の Redirect URLs の許可リストとの照合を変えないため）。
 *
 * - 固定の着地（setup-username・再設定・サインインの失敗・マイページ・
 *   アカウントのページの報せ）は {@link landing} で、その言語で公開しているページなら
 *   その言語の URL、未公開なら日本語の URL にする
 * - `next` は呼び出し側が言語付き（英語なら `/en/...`）で渡すので、
 *   `sanitizeInternalRedirect` で検証してそのまま使う。無いときの既定（マイページ）は
 *   固定の着地と同じく言語に揃える
 * - `next` だけで言語を運ばないのは、プロフィールが無いとき `next` を捨てて
 *   setup-username へ送る経路で言語が失われるため
 * - `Accept-Language`・cookie で推測しない（URL だけで言語を決める方針）
 *
 * OAuth認証コールバック
 */

/** 着地を組むための、リクエストごとの文脈 */
interface CallbackContext {
  /** リクエストの origin（着地はすべて同じ origin の中） */
  readonly origin: string;
  /** 入口が `locale` の query で伝えた言語（検証済み） */
  readonly locale: SupportedLocale;
}

/**
 * 入口が付けた `locale` を読む。対応していない値・無いときは既定の言語（日本語）
 * コールバック言語の読み取り
 *
 * 以前の形のリンク（`locale` を持たない日本語のボタン・旧い OAuth の戻り）は
 * 従来どおり日本語に着く。
 */
function readCallbackLocale(searchParams: URLSearchParams): SupportedLocale {
  const value = searchParams.get("locale");
  return value !== null && isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * 固定の着地を、その言語の公開 URL にする
 * 着地パス解決
 *
 * その言語で公開していないページ（`resolvePublishedHref` が undefined）は日本語の
 * URL のまま（英語の存在しない URL へ送らない）。日本語は恒等。
 *
 * @param path - ロケール非依存のパス（query を含んでよい）
 * @param locale - 着地の言語
 */
function landing(path: string, locale: SupportedLocale): string {
  return resolvePublishedHref(path, locale) ?? path;
}

/** 固定の着地へ送る（{@link landing} を通す） */
function redirectTo(ctx: CallbackContext, path: string): NextResponse {
  return NextResponse.redirect(`${ctx.origin}${landing(path, ctx.locale)}`);
}

async function handleSuccessfulAuth(
  userId: string,
  ctx: CallbackContext,
  safeNext: string,
): Promise<NextResponse> {
  logActivityEvent({ userId, action: "login" });

  const profile = await getProfileByUserId(userId);

  if (!profile) {
    return redirectTo(ctx, "/mypage/setup-username");
  }

  // `next` は呼び出し側が公開 URL（言語付き）で渡したもの。そのまま使う
  return NextResponse.redirect(`${ctx.origin}${safeNext}`);
}

/** 認証に失敗したときの着地（汎用の失敗の文言） */
function redirectToAuthError(ctx: CallbackContext): NextResponse {
  return redirectTo(ctx, "/sign-in?error=auth_callback_error");
}

/**
 * GoTrue がメールリンク検証エラーを返したとき（使用済み・期限切れ等。
 * 例: ?error=access_denied&error_code=otp_expired）。
 * 既にセッションがある＝認証済みならマイページへ。そうでなければ
 * 「リンク無効」を明示し、汎用の認証失敗メッセージで誤解させない。
 */
async function handleEmailLinkError(
  ctx: CallbackContext,
): Promise<NextResponse> {
  const user = await getOptionalUser();
  if (user) return redirectTo(ctx, "/mypage");
  return redirectTo(ctx, "/sign-in?error=email_link_invalid");
}

/**
 * メールアドレス変更 OTP の検証
 *
 * 1 通目（セッション無し）は、ログイン中ならアカウントのページへ、そうでなければ
 * ログインの後にアカウントのページへ戻すよう「もう 1 通」の報せを付けて送る
 * （メールのリンクは、変更を始めた端末と別の端末で開かれることが多い）。
 * 2 通目はセッションが出るので、その端末はログイン状態になる。
 */
async function handleEmailChangeOtp(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tokenHash: string,
  ctx: CallbackContext,
): Promise<NextResponse> {
  const { error, data } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email_change",
  });
  if (error) {
    const user = await getOptionalUser();
    if (user) return redirectTo(ctx, accountPageHref("emailChangeLinkInvalid"));
    return redirectTo(ctx, "/sign-in?error=email_link_invalid");
  }
  if (data.session) {
    logActivityEvent({ userId: data.session.user.id, action: "change_email" });
    return redirectTo(ctx, accountPageHref("emailChangeDone"));
  }
  const pending = accountPageHref("emailChangePending");
  const user = await getOptionalUser();
  if (user) return redirectTo(ctx, pending);
  // 戻り先はサインインのページの `?redirect=` に公開 URL（言語付き）で載せ、
  // サインインのページ自身も同じ言語にする
  return redirectTo(ctx, buildSignInHref(landing(pending, ctx.locale)));
}

/**
 * Google の追加（`linkIdentity`）の戻り
 *
 * 認証サーバーは成功なら `code`、失敗なら `error_code` を付けて戻す。同じ
 * Google アカウントが既にどこかのアカウントについているときは
 * `identity_already_exists`（このアカウントでも別のアカウントでも同じコード）。
 * 成功時の `code` の交換は同じユーザーのセッションを出し直すだけなので、
 * ログインの活動記録は付けない。
 */
async function handleLinkReturn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  searchParams: URLSearchParams,
  ctx: CallbackContext,
): Promise<NextResponse> {
  const code = searchParams.get("code");
  if (searchParams.get("error") || searchParams.get("error_code") || !code) {
    const notice =
      searchParams.get("error_code") === "identity_already_exists"
        ? "linkDuplicate"
        : "linkFailed";
    return redirectTo(ctx, accountPageHref(notice));
  }
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return redirectTo(ctx, accountPageHref("linkFailed"));
  logActivityEvent({
    userId: data.session.user.id,
    action: "link_identity",
    metadata: { provider: LINK_RETURN_GOOGLE },
  });
  return redirectTo(ctx, accountPageHref("linkedGoogle"));
}

/** メール確認 OTP の検証（サインアップフロー） */
async function handleSignupOtp(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tokenHash: string,
  ctx: CallbackContext,
  safeNext: string,
): Promise<NextResponse> {
  const { error, data } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "signup",
  });
  if (!error && data.session) {
    return handleSuccessfulAuth(data.session.user.id, ctx, safeNext);
  }
  return redirectToAuthError(ctx);
}

/** パスワードリカバリ OTP の検証 */
async function handleRecoveryOtp(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tokenHash: string,
  ctx: CallbackContext,
): Promise<NextResponse> {
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });
  if (!error) return redirectTo(ctx, "/reset-password");
  return redirectToAuthError(ctx);
}

/**
 * OAuth / PKCE コード交換。PKCE リカバリフロー（redirectTo に ?type=recovery
 * が含まれる場合）はコード交換後にパスワードリセットへ
 */
async function handleCodeExchange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  code: string,
  type: string | null,
  ctx: CallbackContext,
  safeNext: string,
): Promise<NextResponse> {
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return redirectToAuthError(ctx);
  if (type === "recovery") {
    return redirectTo(ctx, "/reset-password");
  }
  return handleSuccessfulAuth(data.session.user.id, ctx, safeNext);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const ctx: CallbackContext = {
    origin,
    locale: readCallbackLocale(searchParams),
  };
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const safeNext =
    sanitizeInternalRedirect(searchParams.get("next")) ??
    landing("/mypage", ctx.locale);

  const supabase = await createClient();
  if (searchParams.get(LINK_RETURN_PARAM) === LINK_RETURN_GOOGLE) {
    return handleLinkReturn(supabase, searchParams, ctx);
  }
  if (searchParams.get("error") || searchParams.get("error_code")) {
    return handleEmailLinkError(ctx);
  }

  if (tokenHash && type === "email_change") {
    return handleEmailChangeOtp(supabase, tokenHash, ctx);
  }
  if (tokenHash && type === "signup") {
    return handleSignupOtp(supabase, tokenHash, ctx, safeNext);
  }
  if (tokenHash && type === "recovery") {
    return handleRecoveryOtp(supabase, tokenHash, ctx);
  }
  if (code) return handleCodeExchange(supabase, code, type, ctx, safeNext);
  return redirectToAuthError(ctx);
}
