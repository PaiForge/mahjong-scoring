import { NextResponse } from "next/server";

import { getProfileByUserId } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

/**
 * 認証コールバックハンドラ。
 *
 * 4種類のコールバックを処理する:
 * 1. OAuth `code` — 認可コードをセッションに交換する（既存フロー）
 * 2. `code` + `type=recovery` — PKCE リカバリフロー、コード交換後パスワードリセットへ
 * 3. `token_hash` + `type=signup` — メール確認 OTP の検証（PKCE フロー）
 * 4. `token_hash` + `type=recovery` — パスワードリカバリ OTP の検証
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
  const profile = await getProfileByUserId(userId);

  if (!profile) {
    return NextResponse.redirect(`${origin}/mypage/setup-username`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/mypage";
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/mypage";

  const supabase = await createClient();

  // メール確認 OTP の検証（サインアップフロー）
  if (tokenHash && type === "signup") {
    const { error, data } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "signup",
    });

    if (!error && data.session) {
      return handleSuccessfulAuth(data.session.user.id, origin, safeNext);
    }

    return NextResponse.redirect(
      `${origin}/sign-in?error=auth_callback_error`,
    );
  }

  // パスワードリカバリ OTP の検証
  if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });

    if (!error) {
      return NextResponse.redirect(`${origin}/reset-password`);
    }

    return NextResponse.redirect(
      `${origin}/sign-in?error=auth_callback_error`,
    );
  }

  // OAuth / PKCE コード交換
  if (code) {
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // PKCE リカバリフロー: redirectTo に ?type=recovery が含まれる場合
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      return handleSuccessfulAuth(data.session.user.id, origin, safeNext);
    }
  }

  return NextResponse.redirect(
    `${origin}/sign-in?error=auth_callback_error`,
  );
}
