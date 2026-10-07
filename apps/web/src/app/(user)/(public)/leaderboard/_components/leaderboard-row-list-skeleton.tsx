import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import type { PracticeCategory } from "@mahjong-scoring/features/practice/catalog";

import { leaderboardBoardGroups } from "../_lib/board-groups";
import { practiceBoardKey } from "@mahjong-scoring/features/practice-menu-types";

/** 見出し のプレースホルダ幅。分野名の字数に合わせる */
const HEADING_WIDTH: Record<PracticeCategory, string> = {
  fuCalculation: "w-20",
  han: "w-12",
  scoring: "w-20",
};

/**
 * ランキング一覧の読み込み中プレースホルダ
 * ランキング行リストスケルトン
 *
 * 分野の見出しと、その分野に並ぶ土俵の行を実描画と同じ数だけ置く。土俵は
 * 静的な定数（`BOARDS`）で、分野分けもデータ到着前に確定しているため、
 * 行数を近似する理由が無い。狭い画面で長い種目名が折り返す場合を除き、
 * 実表示と同じ行高を確保する。
 *
 * 一覧ページ本体（`page.tsx` の Suspense フォールバック）と loading.tsx の
 * 両方がこれを使う。
 */
export function LeaderboardRowListSkeleton() {
  return (
    <div className="space-y-8">
      <div
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        aria-hidden="true"
      >
        <div className="flex h-7 items-center">
          <SkeletonBar className="h-3.5 w-60 max-w-full" tone={100} />
        </div>
        <SkeletonBar className="h-11 w-40 shrink-0" tone={100} />
      </div>
      {leaderboardBoardGroups().map((group) => (
        <div key={group.category} className="space-y-3">
          <SectionTitleSkeleton width={HEADING_WIDTH[group.category]} />

          <div
            aria-hidden="true"
            className="overflow-hidden rounded-panel border border-panel"
          >
            <div className="flex h-9 items-center border-b border-panel bg-surface-50 px-4 sm:px-5">
              <SkeletonBar className="h-3 w-24" tone={100} />
            </div>
            <ul className="divide-y divide-surface-100">
              {group.boards.map((board) => (
                <li
                  key={practiceBoardKey(board)}
                  className="flex min-h-16 items-center gap-3 px-4 py-4 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <SkeletonBar className="h-4 w-40 max-w-full" tone={100} />
                  </div>
                  <SkeletonBar className="h-6 w-20 shrink-0" tone={100} />
                  <SkeletonBar className="size-4 shrink-0" tone={100} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
