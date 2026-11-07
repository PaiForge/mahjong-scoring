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
        // 英語の版。robots.txt の Disallow は前方一致なので、日本語の行は
        // /en/... に掛からない。マイページは英語でも公開した（ページは noindex）ため
        // 日本語と同じく除外する。/en/u/ は英語では未公開（proxy が 404）だが、
        // 「任意の文字列で URL が作れる」という除外の意図を英語にも当てておく
        // （英語でプロフィールを公開しても黙って索引の対象にならない）
        "/en/mypage",
        "/en/u/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
