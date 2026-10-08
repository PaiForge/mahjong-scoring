import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ScrollView,
  type LayoutChangeEvent,
  type StyleProp,
  type View,
  type ViewStyle,
} from "react-native";

import { scrollTargetY, type ScrollBlock } from "../lib/scroll-target";

/**
 * 渡した要素が見えるところまでスクロールする関数
 *
 * 既定は枠の縦の中央に寄せる。合わせ方は {@link scrollTargetY} を参照。
 * `until` を渡すと、`target` の上端から `until` の下端までをひとまとまりと
 * して扱う（離れた 2 つの要素を一緒に見せたいとき。枠に収まらなければ
 * `nearest` は上端を優先する）
 */
type ScrollIntoView = (
  target: View | null,
  options?: { readonly block?: ScrollBlock; readonly until?: View | null },
) => void;

const ScrollIntoViewContext = createContext<ScrollIntoView | undefined>(
  undefined,
);

/**
 * スクロール枠の「ここを見せて」を子孫へ配る
 * 中央寄せスクロール
 *
 * web の `scrollIntoView({ block: "center" })` に当たる。中身の要素は自分が
 * どのスクロール枠に入っているかを知らないので、枠がコンテキストで
 * スクロールの関数を配り、子孫（点数早見表の注目セル・役一覧の役）がそれを
 * 呼ぶ。位置は枠の中身（`getInnerViewNode`）からの距離で測るので、枠の
 * 子の並びを包み直さない（`stickyHeaderIndices` が直接の子を数えるため）。
 *
 * @param scrollRef 対象のスクロール枠
 * @param viewportHeight 枠の見えている高さ（`onLayout` で更新する入れ物）
 * @param scrollY 今のスクロール位置（`onScroll` で更新する入れ物）
 */
export function ScrollIntoViewProvider({
  scrollRef,
  viewportHeight,
  scrollY,
  children,
}: {
  readonly scrollRef: RefObject<ScrollView | null>;
  readonly viewportHeight: RefObject<number>;
  readonly scrollY: RefObject<number>;
  readonly children: ReactNode;
}) {
  const scrollIntoView = useCallback<ScrollIntoView>(
    (target, options) => {
      const scroll = scrollRef.current;
      if (target === null || scroll === null) return;
      // 中身の View。型定義は any（RN の非公開寄りの API だが、iOS / Android /
      // web のいずれも中身のノードを返す）
      const content = scroll.getInnerViewNode();
      if (content == null) return;
      const scrollTo = (y: number, height: number) => {
        const top = scrollTargetY(
          options?.block ?? "center",
          { y, height },
          viewportHeight.current,
          scrollY.current,
        );
        if (top !== undefined) scroll.scrollTo({ y: top, animated: true });
      };
      const until = options?.until;
      target.measureLayout(content, (_x, y, _width, height) => {
        if (until == null) {
          scrollTo(y, height);
          return;
        }
        until.measureLayout(content, (_ux, untilY, _uw, untilHeight) => {
          scrollTo(y, Math.max(height, untilY + untilHeight - y));
        });
      });
    },
    [scrollRef, viewportHeight, scrollY],
  );

  return (
    <ScrollIntoViewContext.Provider value={scrollIntoView}>
      {children}
    </ScrollIntoViewContext.Provider>
  );
}

/**
 * {@link ScrollIntoViewProvider} を備えたスクロール枠
 *
 * シート（点数早見表・役一覧の参照）の中身のように、`Screen` の外で
 * スクロールさせるときに使う。
 */
export function ScrollIntoViewScrollView({
  style,
  children,
}: {
  readonly style?: StyleProp<ViewStyle>;
  readonly children: ReactNode;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const viewportHeight = useRef(0);
  const scrollY = useRef(0);

  return (
    <ScrollIntoViewProvider
      scrollRef={scrollRef}
      viewportHeight={viewportHeight}
      scrollY={scrollY}
    >
      <ScrollView
        ref={scrollRef}
        style={style}
        onLayout={(e: LayoutChangeEvent) => {
          viewportHeight.current = e.nativeEvent.layout.height;
        }}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>
    </ScrollIntoViewProvider>
  );
}

/**
 * 囲んでいる枠のスクロール関数
 *
 * 枠の外では何もしない関数を返す。
 */
export function useScrollIntoView(): ScrollIntoView {
  return useContext(ScrollIntoViewContext) ?? noop;
}

function noop() {}
