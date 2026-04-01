import { NextResponse } from "next/server";

/**
 * POST /auth/logout
 *
 * ログアウトのサーバーサイドエンドポイント。
 * 実際のサインアウト処理はクライアント側で `supabase.auth.signOut()` により行う。
 *
 * 現時点ではサーバーサイドの処理は不要だが、将来的に監査ログ（activity log）の
 * 記録等を追加するための拡張ポイントとして存在する。
 *
 * ログアウトエンドポイント
 */
export async function POST() {
  return NextResponse.json({ ok: true });
}
