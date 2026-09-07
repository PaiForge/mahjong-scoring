import {
  LinkRowList,
  LinkRowSkeleton,
} from "@/app/(user)/_components/link-row";

import { BOARDS, boardKey } from "../_lib/types";

/**
 * ランキング一覧の読み込み中プレースホルダ
 * ランキング行リストスケルトン
 *
 * 並ぶ土俵は静的な定数（{@link BOARDS}）なので、行数を近似せず実際の数だけ
 * 置く。データ到着時にリストの高さが変わらず、下に続くパンくずも動かない。
 *
 * 一覧ページ本体（`page.tsx` の Suspense フォールバック）と loading.tsx の
 * 両方がこれを使う。
 */
export function LeaderboardRowListSkeleton() {
  return (
    <LinkRowList>
      {BOARDS.map((board) => (
        <LinkRowSkeleton
          key={boardKey(board)}
          leading
          titleWidthClassName="w-40"
          trailingWidthClassName="w-12"
        />
      ))}
    </LinkRowList>
  );
}
