"use server";

import type { ReactNode } from "react";

import {
  isPracticeMenuSlug,
  practiceMenuBySlug,
  resolvePracticeVariant,
} from "@mahjong-scoring/features/practice-menu-types";
import { isExamMenu } from "@mahjong-scoring/features/practice/catalog";

import { BoardLeaderboardPreview } from "../_components/leaderboard-preview";

/**
 * 練習の説明ページに出す TOP3 を描画して返す
 * 説明ページのリーダーボードプレビュー
 *
 * @remarks
 * 説明ページは静的ルートで、ランキングをサーバーの描画で読むと 2 つの圧力が
 * 掛かる。ルートの再検証間隔は描画が触れたデータキャッシュの最小値になるため、
 * ランキングのキャッシュ（5 分）が全練習の説明ページを 5 分の ISR に縛る。
 * さらにランキングはタグ付きで、表示名・アバター・公開設定の変更のたびに
 * `purgeLeaderboardCache()` がそのタグを失効させ、全練習の説明ページが作り直される。
 * そこで描画はハイドレーション後にこの Action から取り、ページの描画は
 * ランキングに触れない（`LeaderboardPreviewLoader`）。
 *
 * 結果ページの表示部品をそのまま使うため、行ではなく描画済みの UI を返す。
 * `slug` はブラウザから来るので、練習の slug でなければ何も返さない。
 * 昇級試験は記録を残さずランキングも無いため返さない。
 * 出題設定を持つ練習は既定のバリアントの土俵を出す — 選択パネルの状態は
 * クライアントにあり、選び直すたびに取り直すほどの導線ではない。
 */
export async function renderLeaderboardPreview(
  slug: string,
): Promise<ReactNode> {
  if (!isPracticeMenuSlug(slug) || isExamMenu(slug)) {
    return undefined;
  }

  return (
    <BoardLeaderboardPreview
      board={{
        menuType: practiceMenuBySlug(slug).menuType,
        variant: resolvePracticeVariant(slug, undefined),
      }}
    />
  );
}
