import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { getOptionalVerifiedUser } from "../../../lib/auth";
import { getClientIp } from "../../../lib/client-ip";
import { db, userRoles } from "../../../lib/db";

interface AuthSuccess {
  readonly userId: string;
}

interface AuthFailure {
  readonly error: "unauthorized";
}

type AuthResult = AuthSuccess | AuthFailure;

/**
 * 管理者認証チェック
 *
 * Supabase Auth でユーザー認証を確認し、user_roles テーブルで admin ロールを検証する。
 *
 * 認証には `getOptionalVerifiedUser` を使う（`getOptionalUser` ではない）。
 * 管理画面は失効済みセッションを有効期限まで通してはならないため、JWT の
 * ローカル検証ではなく認証サーバーへ問い合わせる側を選ぶ。同関数は
 * `cache()` 済みなので、1 リクエスト内で何度呼んでも往復は 1 回で済む。
 */
export async function requireAdmin(): Promise<AuthResult> {
  const user = await getOptionalVerifiedUser();

  if (!user) {
    return { error: "unauthorized" };
  }

  const [userRole] = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, user.id))
    .limit(1);

  if (!userRole || userRole.role !== "admin") {
    return { error: "unauthorized" };
  }

  return { userId: user.id };
}

/**
 * Server Action を実行する管理者 — 誰が（`actorId`）・どこから（`ipAddress`）
 * 管理者の操作主体
 *
 * 監査ログ（`recordContentAction` / `recordModerationAction`）の 2 欄で、
 * どのアクションも同じ組を記録する。IP はリクエストヘッダー由来で
 * 取れないこともある（`getClientIp`）。
 */
export interface AdminActor {
  readonly actorId: string;
  readonly ipAddress: string | undefined;
}

/**
 * Server Action 用の管理者ガード。
 *
 * `requireAdmin()` に失敗した場合、アクションが返すべきエラーキーに
 * 変換して返す（アクションごとに UI 側の i18n キーが異なるため引数で受け取る）。
 * 通ったときは監査ログに残す操作元の IP も一緒に返す — 管理者の操作は
 * すべて記録するので、アクションごとに `getClientIp()` を呼ばせない。
 *
 * @param failureError - 認証失敗時に返すエラーキー
 */
export async function requireAdminActor<E extends string>(
  failureError: E,
): Promise<AdminActor | { readonly error: E }> {
  const result = await requireAdmin();
  if ("error" in result) {
    return { error: failureError };
  }
  return { actorId: result.userId, ipAddress: await getClientIp() };
}

/**
 * 管理ページ用の認証ガード。
 *
 * `requireAdmin()` に失敗したら `notFound()` で打ち切る。レイアウトではなく
 * 各ページで呼ぶことで、サイドバー（シェル）を即時描画しつつ、ページ本体の
 * 認証待ちとデータ取得を 1 つの loading 境界（各ルートの loading.tsx）で覆える。
 *
 * @returns 認証済みユーザーの ID
 */
export async function requireAdminPage(): Promise<string> {
  const result = await requireAdmin();

  if ("error" in result) {
    notFound();
  }

  return result.userId;
}
