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
 * @pai-forge/mahjong-react-ui の `Hai` は `TileImageProvider` の配下でだけ描ける。
 * 同梱画像（base64 の data URI）を使う道もあるが、それだと牌を並べるページの
 * HTML に画像本体が埋め込まれ（`/practice` は 5.3MB、教本の章は 0.9MB。
 * 2026-09 に本番で実測）、ブラウザのキャッシュにも乗らない。ルートレイアウトで
 * これに包み、全ページの牌を `/tiles/*.webp` に向ける。
 *
 * `@pai-forge/mahjong-react-ui/bundled-images`（同梱画像のエントリ、2.3MB）は
 * web では import しない。0.5.0 までは本体のエントリが画像を抱えていたため、
 * この Provider を置くだけで全ページが 2.3MB（brotli 1.7MB）の JS を読み、
 * PageSpeed のモバイルの LCP が 12 秒超と判定されていた（2026-10 に実測）。
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
