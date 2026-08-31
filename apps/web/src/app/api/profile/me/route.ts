import type { ViewerProfileResponse } from "@/app/_lib/viewer-profile";
import { jsonPrivate } from "@/lib/api-response";
import { getOptionalUser } from "@/lib/auth";
import { getProfileCardByUserId } from "@/lib/db/queries";
import { logExternalError } from "@/lib/log-error";

/**
 * 閲覧中のユーザー自身のプロフィール表示情報を返すエンドポイント。
 * ヘッダーのアカウント表示（アバター）が使う。
 *
 * 未ログイン・プロフィール未作成（仮登録）・取得失敗のいずれも `profile: null` を
 * 200 で返す。呼び出し元は表示の分岐しかしないため、未認証をエラーとして扱う必要がない。
 *
 * 自分のプロフィール取得API
 */
export async function GET() {
  const empty: ViewerProfileResponse = { profile: null };

  try {
    const user = await getOptionalUser();
    if (!user) return jsonPrivate(empty);

    const profile = await getProfileCardByUserId(user.id);
    if (!profile) return jsonPrivate(empty);

    return jsonPrivate<ViewerProfileResponse>({
      profile: {
        avatarUrl: profile.avatarUrl ?? null,
        name: profile.displayName ?? profile.username,
      },
    });
  } catch (error) {
    logExternalError("GET /api/profile/me", "プロフィールの取得に失敗", error);
    return jsonPrivate(empty);
  }
}
