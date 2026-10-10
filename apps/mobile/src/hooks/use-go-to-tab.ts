import { useCallback } from "react";
import { useRouter, useSegments } from "expo-router";

/**
 * 下部タブの入口を表示する
 * タブへ移るフック
 *
 * タブはルートのスタックの最下段（`(tabs)`）にあり、詳細の画面はその上に
 * 積む。積んだ画面からタブの入口へ `push` / `navigate` で送ると、ルートの
 * スタックは名前の違う画面として `(tabs)` をもう 1 組積む（既にある画面へは
 * 戻らない）。タブバーごと右から入り、戻るとさっきの画面に戻り、練習一覧の
 * 絞り込みやスクロール位置もタブの組ごとに分かれる。
 *
 * - タブの中から: `navigate`（タブの切り替え）
 * - 積んだ画面から: `dismissTo`。下の `(tabs)` まで上の画面を閉じ、行き先の
 *   タブを params で渡して切り替える。履歴に `(tabs)` が無い（ディープリンクで
 *   直接開いた）ときは今の画面を `(tabs)` に置き換える
 *
 * 「タブの入口を出す」操作で、タブの中の前回の位置へ戻す操作ではない。
 * 行き先は `isTabHref`（`lib/tab-href.ts`）が真になるパスに限る。
 */
export function useGoToTab(): (href: string) => void {
  const router = useRouter();
  const segments = useSegments();
  const inTabs = segments[0] === "(tabs)";
  return useCallback(
    (href: string) => {
      if (inTabs) router.navigate(href);
      else router.dismissTo(href);
    },
    [router, inTabs],
  );
}
