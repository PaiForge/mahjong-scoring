import type { MetadataRoute } from "next";

import { SITE_URL } from "@/config";

/** `/robots.txt` を生成する（Next.js の `MetadataRoute.Robots` 規約） */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/mypage",
        "/api",
        // /u/ は公開プロフィール。存在しないユーザー名でも 200（ソフト 404）を返す
        // 動的ルートで、任意の文字列から無限に URL を作れてしまうため除外する。
        // 実在するプロフィールも検索に載らなくなる（載せたくなったらここを外し、
        // ソフト 404 を先に解消する）
        "/u/",
        // 英語はクロールを許可し、認証ガード・noindex・未公開ページの404を
        // 検索エンジンに読ませる。Disallow は索引除外の代わりにならない。
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
