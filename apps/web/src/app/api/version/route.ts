import { NextResponse } from "next/server";

import { type AppVersionResponse, APP_BUILD_ID } from "@/app/_lib/app-version";

/**
 * 今配信しているビルドの ID を返す。開いたままのタブが新版の有無を知る唯一の窓口
 * ビルドID取得API
 *
 * 認証もユーザー差も無い公開の値。ただしキャッシュには一切乗せない —
 * ブラウザや CDN に古い応答が残ると「新版が出たのに同じ ID が返り続ける」
 * という、この API が解こうとしている問題そのものを再現してしまう。
 * 値はビルド定数なので、要求ごとに描画しても処理は無い。
 */
export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  const body: AppVersionResponse =
    APP_BUILD_ID === undefined ? {} : { buildId: APP_BUILD_ID };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
