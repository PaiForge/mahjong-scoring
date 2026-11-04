import { NextResponse } from "next/server";

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
 * OAuth認証コールバック
 */

async function handleSuccessfulAuth(
  userId: string,
  origin: string,
  safeNext: string,
): Promise<NextResponse> {
  logActivityEvent({ userId, action: "login" });

  const profile = await getProfileByUserId(userId);

  if (!profile) {
    return NextResponse.redirect(`${origin}/mypage/setup-username`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}

/** 認証に失敗したときの着地（汎用の失敗の文言） */
function redirectToAuthError(origin: string): NextResponse {
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`);
}

/**
 * GoTrue がメールリンク検証エラーを返したとき（使用済み・期限切れ等。
 * 例: ?error=access_denied&error_code=otp_expired）。
 * 既にセッションがある＝認証済みならマイページへ。そうでなければ
 * 「リンク無効」を明示し、汎用の認証失敗メッセージで誤解させない。
 */
async function handleEmailLinkError(origin: string): Promise<NextResponse> {
  const user = await getOptionalUser();
  if (user) return NextResponse.redirect(`${origin}/mypage`);
  return NextResponse.redirect(`${origin}/sign-in?error=email_link_invalid`);
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
  origin: string,
): Promise<NextResponse> {
  const { error, data } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email_change",
  });
  if (error) {
    const user = await getOptionalUser();
    if (user)
      return NextResponse.redirect(
        `${origin}${accountPageHref("emailChangeLinkInvalid")}`,
      );
    return NextResponse.redirect(`${origin}/sign-in?error=email_link_invalid`);
  }
  if (data.session) {
    logActivityEvent({ userId: data.session.user.id, action: "change_email" });
    return NextResponse.redirect(
      `${origin}${accountPageHref("emailChangeDone")}`,
    );
  }
  const pending = accountPageHref("emailChangePending");
  const user = await getOptionalUser();
  if (user) return NextResponse.redirect(`${origin}${pending}`);
  return NextResponse.redirect(`${origin}${buildSignInHref(pending)}`);
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
  origin: string,
): Promise<NextResponse> {
  const code = searchParams.get("code");
  if (searchParams.get("error") || searchParams.get("error_code") || !code) {
    const notice =
      searchParams.get("error_code") === "identity_already_exists"
        ? "linkDuplicate"
        : "linkFailed";
    return NextResponse.redirect(`${origin}${accountPageHref(notice)}`);
  }
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);
  if (error)
    return NextResponse.redirect(`${origin}${accountPageHref("linkFailed")}`);
  logActivityEvent({
    userId: data.session.user.id,
    action: "link_identity",
    metadata: { provider: LINK_RETURN_GOOGLE },
  });
  return NextResponse.redirect(`${origin}${accountPageHref("linkedGoogle")}`);
}

/** メール確認 OTP の検証（サインアップフロー） */
async function handleSignupOtp(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tokenHash: string,
  origin: string,
  safeNext: string,
): Promise<NextResponse> {
  const { error, data } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "signup",
  });
  if (!error && data.session) {
    return handleSuccessfulAuth(data.session.user.id, origin, safeNext);
  }
  return redirectToAuthError(origin);
}

/** パスワードリカバリ OTP の検証 */
async function handleRecoveryOtp(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tokenHash: string,
  origin: string,
): Promise<NextResponse> {
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });
  if (!error) return NextResponse.redirect(`${origin}/reset-password`);
  return redirectToAuthError(origin);
}

/**
 * OAuth / PKCE コード交換。PKCE リカバリフロー（redirectTo に ?type=recovery
 * が含まれる場合）はコード交換後にパスワードリセットへ
 */
async function handleCodeExchange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  code: string,
  type: string | null,
  origin: string,
  safeNext: string,
): Promise<NextResponse> {
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return redirectToAuthError(origin);
  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }
  return handleSuccessfulAuth(data.session.user.id, origin, safeNext);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const safeNext =
    sanitizeInternalRedirect(searchParams.get("next")) ?? "/mypage";

  const supabase = await createClient();
  if (searchParams.get(LINK_RETURN_PARAM) === LINK_RETURN_GOOGLE) {
    return handleLinkReturn(supabase, searchParams, origin);
  }
  if (searchParams.get("error") || searchParams.get("error_code")) {
    return handleEmailLinkError(origin);
  }

  if (tokenHash && type === "email_change") {
    return handleEmailChangeOtp(supabase, tokenHash, origin);
  }
  if (tokenHash && type === "signup") {
    return handleSignupOtp(supabase, tokenHash, origin, safeNext);
  }
  if (tokenHash && type === "recovery") {
    return handleRecoveryOtp(supabase, tokenHash, origin);
  }
  if (code) return handleCodeExchange(supabase, code, type, origin, safeNext);
  return redirectToAuthError(origin);
}
