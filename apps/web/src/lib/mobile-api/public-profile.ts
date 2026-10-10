import "server-only";

import type { NextResponse } from "next/server";

import type {
  MobilePublicProfileErrorCode,
  MobilePublicProfileResponse,
} from "@mahjong-scoring/features/public-profile/mobile-api";

import { isBlocking } from "../blocks/blocks";
import { getPublicProfileByUsername } from "../db/queries";

import { authorizeOptionalMobileRequest } from "./auth";
import { mobileJson, mobileServerError } from "./response";

/**
 * ある人の公開プロフィールを返す（アプリ向け）
 * 公開プロフィールAPI（アプリ向け）
 *
 * web の `/u/<ユーザー名>` と同じ材料。ゲストも読める。退会・BAN 済み・
 * 存在しない人は 404 `notFound`。閲覧者がブロックしている人は 404 にせず、
 * 中身を除いて `relation: "blocking"` だけを返す（解除の入口を残すため。web と同じ）。
 *
 * @param username - URL のユーザー名
 */
export async function handleReadPublicProfile(
  request: Request,
  username: string,
): Promise<NextResponse> {
  const auth = await authorizeOptionalMobileRequest(
    request,
    "readPublicProfile",
  );
  if (!auth.ok) return auth.response;
  const viewerId = auth.viewer?.user.id;
  try {
    const profile = await getPublicProfileByUsername(username);
    if (!profile) {
      return mobileJson<{ error: MobilePublicProfileErrorCode }>(
        { error: "notFound" },
        { status: 404 },
      );
    }
    if (await isBlocking(viewerId, profile.id)) {
      return mobileJson<MobilePublicProfileResponse>({
        username: profile.username,
        relation: "blocking",
      });
    }
    return mobileJson<MobilePublicProfileResponse>({
      username: profile.username,
      relation:
        viewerId === undefined
          ? "guest"
          : viewerId === profile.id
            ? "self"
            : "member",
      displayName: profile.displayName ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
      bio: profile.bio ?? undefined,
      xUsername: profile.xUsername ?? undefined,
      instagramUsername: profile.instagramUsername ?? undefined,
      youtubeHandle: profile.youtubeHandle ?? undefined,
    });
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/users/[username]",
      "読み取りに失敗",
      error,
    );
  }
}
