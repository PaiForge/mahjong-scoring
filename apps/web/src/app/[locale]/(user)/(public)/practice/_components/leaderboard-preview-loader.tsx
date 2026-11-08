"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";

import { renderLeaderboardPreview } from "../_actions/render-leaderboard-preview";

/**
 * 練習の説明ページの TOP3 をハイドレーション後に取って描画する
 * リーダーボードプレビューの遅延読み込み
 *
 * @remarks
 * ページの描画でランキングを読まない理由は `renderLeaderboardPreview` を参照。
 * 届くまでは何も描かない。ページ末尾に置くためスクロール位置を押し下げず、
 * まだ誰も挑戦していない練習では本当に空なので、場所を取っておく意味が無い。
 * 取得に失敗しても出さないだけにする — ページの本体は上の練習で、
 * ランキングへはドロワーからも行ける。
 */
export function LeaderboardPreviewLoader({
  slug,
}: {
  readonly slug: PracticeMenuSlug;
}) {
  const [preview, setPreview] = useState<ReactNode>();

  useEffect(() => {
    let cancelled = false;
    renderLeaderboardPreview(slug)
      .then((node) => {
        if (!cancelled) {
          setPreview(node);
        }
      })
      .catch(() => {
        // 上の @remarks の通り、失敗は出さないだけにする
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return preview;
}
