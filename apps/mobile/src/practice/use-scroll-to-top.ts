import { use, useCallback, useRef } from "react";
import { Platform, type ScrollViewInstance } from "react-native";
import { HeaderHeightContext } from "expo-router/react-navigation";

/**
 * 解答中の画面の本文を先頭へ戻す
 * 盤面の先頭へ戻す
 *
 * `scrollRef` を `Screen` の `ref` に渡し、盤面が表示を切り替えたとき（回答・
 * 開示・次の問題）に `scrollToTop` を呼ぶ。
 *
 * iOS では解答中の画面のヘッダーが透け、本文はその下へ潜る。OS がヘッダーの
 * 高さぶんの inset を付けるので、先頭の位置は `y: 0` ではなくその高さぶん負の
 * 値になる（`y: 0` へ戻すと、本文の頭がヘッダーの裏に潜った位置で止まる）。
 * ここで戻すのは見出しを持ち `stickyHeaderIndices` を使わない画面（ヘッダーが
 * 透ける画面）に限るので、ヘッダーの高さをそのまま使う。Android はヘッダーを
 * 透けさせないので 0。
 */
export function useScrollToTop() {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const headerHeight = use(HeaderHeightContext) ?? 0;
  const top = Platform.OS === "ios" ? -headerHeight : 0;
  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: top, animated: false });
  }, [top]);
  return { scrollRef, scrollToTop };
}
