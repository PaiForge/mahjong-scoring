import {
  LinkRowList,
  LinkRowSkeleton,
} from "@/app/(user)/_components/link-row";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import type { PracticeCategory } from "@/app/(user)/(public)/practice/_lib/practice-catalog";

import { leaderboardBoardGroups } from "../_lib/board-groups";
import { boardKey } from "../_lib/types";

/** 見出し pill のプレースホルダ幅。分野名の字数に合わせる */
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
 * 行数を近似する理由が無い。読み込み中と読み込み後で一覧の高さが変わらず、
 * 下に続くパンくずも動かない。
 *
 * 一覧ページ本体（`page.tsx` の Suspense フォールバック）と loading.tsx の
 * 両方がこれを使う。
 */
export function LeaderboardRowListSkeleton() {
  return (
    <div className="space-y-8">
      {leaderboardBoardGroups().map((group) => (
        <div key={group.category} className="space-y-3">
          <SectionTitleSkeleton width={HEADING_WIDTH[group.category]} />

          <LinkRowList>
            {group.boards.map((board) => (
              <LinkRowSkeleton
                key={boardKey(board)}
                titleWidthClassName="w-40"
                trailingWidthClassName="w-12"
              />
            ))}
          </LinkRowList>
        </div>
      ))}
    </div>
  );
}
