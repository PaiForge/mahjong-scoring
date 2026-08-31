import { NextResponse } from "next/server";

import type { ViewerRanksResponse } from "@/app/_lib/viewer-ranks";
import { getOptionalUser } from "@/lib/auth";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import { logExternalError } from "@/lib/log-error";

/**
 * 閲覧中のユーザー自身の達成済み段級位スラッグを返すエンドポイント。
 * 昇級試験の説明ページの開始ボタン出し分け（受験資格の表示）が使う。
 *
 * 未ログインは空配列を 200 で返す（未認証はエラーではなく「級を持たない」）。
 * 取得失敗は 500 を返す — 空配列で誤魔化すと、級を持つユーザーの画面が
 * 「無級なので受験不可」という誤った表示に倒れるため。呼び出し側は失敗を
 * undefined として受け、表示は受験可へ fail-open する。
 *
 * 自分の段級位取得API
 */
export async function GET() {
  try {
    const user = await getOptionalUser();
    if (!user) return jsonPrivate({ rankSlugs: [] });

    return jsonPrivate({ rankSlugs: await getUserRankSlugs(user.id) });
  } catch (error) {
    logExternalError("GET /api/ranks/me", "段級位の取得に失敗", error);
    return NextResponse.json(
      { error: "unknown" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}

/**
 * ユーザーごとに異なる応答なので、共有キャッシュに乗らないよう明示する。
 */
function jsonPrivate(body: ViewerRanksResponse): NextResponse {
  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
