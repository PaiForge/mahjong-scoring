"use client";

import type { ReactNode } from "react";
import {
  createTileImageResolver,
  TileImageProvider,
} from "@pai-forge/mahjong-react-ui";

/**
 * 牌画像の参照先。`public/tiles/<name>.webp`（`pnpm --filter web tiles:generate` の生成物）
 */
const resolveTileImage = createTileImageResolver({
  baseUrl: "/tiles",
  extension: ".webp",
});

/**
 * アプリ全体の牌画像を静的ファイルに向ける Provider
 * 牌画像プロバイダ
 *
 * @pai-forge/mahjong-react-ui の `Hai` は既定で同梱画像を base64 の data URI として
 * 描く。それだと牌を並べるページの HTML に画像本体が埋め込まれ（`/practice` は
 * 5.3MB、教本の章は 0.9MB。2026-09 に本番で実測）、ブラウザのキャッシュにも
 * 乗らない。ルートレイアウトでこれに包み、全ページの牌を `/tiles/*.webp` に向ける。
 */
export function AppTileImageProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <TileImageProvider resolve={resolveTileImage}>{children}</TileImageProvider>
  );
}
