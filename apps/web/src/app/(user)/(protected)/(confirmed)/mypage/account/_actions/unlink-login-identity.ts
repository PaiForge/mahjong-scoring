"use server";

import { evaluateIdentityRemoval } from "@mahjong-scoring/features/account/login-methods";
import type { IdentityRemovalBlocker } from "@mahjong-scoring/features/account/login-methods";

import type { ActionResult } from "@/lib/action-types";
import { guardUserAction } from "@/lib/action-guard";
import type { UserActionGuardErrorCode } from "@/lib/action-guard";
import { logActivityEvent } from "@/lib/activity-log";
import { revokeAppleTokenForUnlink } from "@/lib/apple/refresh-tokens";
import { logExternalError } from "@/lib/log-error";
import { createClient } from "@/lib/supabase/server";
import {
  ensureEmailIdentity,
  getAccountLoginState,
} from "@/lib/users/login-methods";

/**
 * 連携を外す操作の失敗理由
 *
 * - `removal:*` — 外せない（{@link IdentityRemovalBlocker}）。ボタンは同じ判定で
 *   無効にしているので、ここに来るのは画面が古いとき
 * - `appleUnavailable` — Apple のトークンの取り消しが通らなかった（Apple に
 *   届かない・設定が無い）。取り消せていないので連携は外していない
 * - `unlinkFailed` — 認証サーバーが連携を外さなかった
 */
export type UnlinkLoginIdentityError =
  | UserActionGuardErrorCode
  | `removal:${IdentityRemovalBlocker}`
  | "appleUnavailable"
  | "unlinkFailed";

/**
 * Google / Apple の連携を外す Server Action
 * 連携の解除
 *
 * 判定（{@link evaluateIdentityRemoval}）を通ったら、Apple なら預かっている
 * refresh token を Apple に取り消させ、パスワードを持つ人には `email` の
 * 連携を補ってから（認証サーバーは連携が 1 つだけだと外させない）、
 * ログイン中のセッションで認証サーバーに外させる。
 *
 * Apple の取り消しの後に認証サーバーが外さなかったときは、トークンだけが
 * 消えた状態で連携が残る。やり直せば「トークンが無い連携」として取り消し
 * 無しで外れる（取り消しは済んでいる）。
 *
 * @param identityId - 外す連携の ID（`LinkedIdentity.id`）
 */
export async function unlinkLoginIdentity(
  identityId: string,
): Promise<ActionResult<UnlinkLoginIdentityError>> {
  const guard = await guardUserAction("unlinkLoginIdentity");
  if ("error" in guard) return guard;
  const { user } = guard;

  const state = await getAccountLoginState(user.id);
  const decision = evaluateIdentityRemoval(state, identityId);
  if (!decision.allowed) return { error: `removal:${decision.reason}` };
  const { identity } = decision;

  if (identity.provider === "apple") {
    const appleSubject = state.appleSubjects.get(identity.id);
    try {
      if (appleSubject !== undefined)
        await revokeAppleTokenForUnlink(user.id, appleSubject);
    } catch (error) {
      logExternalError(
        "unlinkLoginIdentity",
        "failed to revoke the Apple token",
        error,
      );
      return { error: "appleUnavailable" };
    }
  }

  if (state.hasPassword && state.email !== undefined)
    await ensureEmailIdentity(user.id, state.email, state.identities);

  const supabase = await createClient();
  const { data: identitiesData, error: identitiesError } =
    await supabase.auth.getUserIdentities();
  const target = identitiesData?.identities.find(
    (i) => i.identity_id === identity.id,
  );
  if (identitiesError || !target) return { error: "removal:notLinked" };
  const { error } = await supabase.auth.unlinkIdentity(target);
  if (error) {
    logExternalError("unlinkLoginIdentity", "unlinkIdentity failed", error);
    return { error: "unlinkFailed" };
  }

  logActivityEvent({
    userId: user.id,
    action: "unlink_identity",
    metadata: { provider: identity.provider },
  });
  return { success: true };
}
