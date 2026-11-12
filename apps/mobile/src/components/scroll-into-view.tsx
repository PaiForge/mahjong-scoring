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
  type ScrollViewInstance,
  type StyleProp,
  type ViewInstance,
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
  target: ViewInstance | null,
  options?: {
    readonly block?: ScrollBlock;
    readonly until?: ViewInstance | null;
  },
) => void;

/** 枠の上下で OS の帯（ヘッダー・タブバー）に隠れる高さ */
export interface ScrollInsets {
  readonly top: number;
  readonly bottom: number;
}

/** inset を渡さない枠（シートの中身等）の既定 */
const NO_INSETS: RefObject<ScrollInsets> = { current: { top: 0, bottom: 0 } };

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
 * 呼ぶ。位置は枠の中身（`getInnerViewRef`）からの距離で測るので、枠の
 * 子の並びを包み直さない（`stickyHeaderIndices` が直接の子を数えるため）。
 * 自分は view を描かない（`Screen` の `ScrollView` が画面の直下に来ないと、
 * iOS がヘッダーとタブバーのぶんの inset を自動で付けない）。
 *
 * 枠の上下が OS のヘッダー・タブバーの下に潜る画面（`Screen` の透けるヘッダー。
 * iOS の `contentInsetAdjustmentBehavior="automatic"`）では、見えている範囲は
 * 枠の高さから上下の inset を除いた帯で、スクロール量は先頭で `-上の inset`
 * （負の値）から始まる。`insets` を渡すと、その帯を「枠」とみなして合わせ、
 * 求めた位置を inset のぶんずらしてからスクロールする（先頭に合わせると
 * `-上の inset` になり、要素がヘッダーの裏に隠れない）。
 *
 * @param scrollRef 対象のスクロール枠
 * @param viewportHeight 枠の高さ（`onLayout` で更新する入れ物。inset を含む）
 * @param scrollY 今のスクロール位置（`onScroll` で更新する入れ物）。まだ
 *   一度もスクロールしていなければ `undefined`（先頭 = `-上の inset` とみなす）
 * @param insets 枠の上下で OS の帯に隠れる高さ（省略時は 0）
 */
export function ScrollIntoViewProvider({
  scrollRef,
  viewportHeight,
  scrollY,
  insets = NO_INSETS,
  children,
}: {
  readonly scrollRef: RefObject<ScrollViewInstance | null>;
  readonly viewportHeight: RefObject<number>;
  readonly scrollY: RefObject<number | undefined>;
  readonly insets?: RefObject<ScrollInsets>;
  readonly children: ReactNode;
}) {
  const scrollIntoView = useCallback<ScrollIntoView>(
    (target, options) => {
      const scroll = scrollRef.current;
      if (target === null || scroll === null) return;
      // 中身の View の ref。`getInnerViewNode()`（数値のタグ）は使わない —
      // New Architecture の `measureLayout` は ref 以外を受け取ると黙って何も
      // せず（開発ビルドで警告が出るだけ）、スクロールしない。web 版
      // （react-native-web）はどちらも要素を返すため、web では差が見えない。
      // 型定義が勧める `innerViewRef` プロップは react-native-web が受け取らない
      const content = scroll.getInnerViewRef();
      if (content == null) return;
      const scrollTo = (y: number, height: number) => {
        const { top: insetTop, bottom: insetBottom } = insets.current;
        // 見えている帯の上端（中身の座標）。スクロール前は先頭 = -insetTop
        const visibleTop = (scrollY.current ?? -insetTop) + insetTop;
        const top = scrollTargetY(
          options?.block ?? "center",
          { y, height },
          viewportHeight.current - insetTop - insetBottom,
          visibleTop,
        );
        if (top !== undefined) {
          scroll.scrollTo({ y: top - insetTop, animated: true });
        }
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
    [scrollRef, viewportHeight, scrollY, insets],
  );

  return (
    <ScrollIntoViewContext value={scrollIntoView}>
      {children}
    </ScrollIntoViewContext>
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
  const scrollRef = useRef<ScrollViewInstance>(null);
  const viewportHeight = useRef(0);
  const scrollY = useRef<number | undefined>(undefined);

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

/**
 * 「ここを見せて」の目印（点数早見表の正解のセル・役一覧で開いた役）
 * 注目アンカー
 *
 * 見せたい要素をこの ref と onLayout を持つ View で包む。置かれたことを
 * {@link useFocusAnchor} が受け取り、スクロール枠の中央へ寄せる。
 */
export interface FocusAnchor {
  readonly ref: RefObject<ViewInstance | null>;
  readonly onLayout: () => void;
}

/**
 * 注目する要素が置かれたら一度だけ枠の中央へ寄せる
 * 一度だけ中央寄せ
 *
 * 寄せるのは最初に置かれたときだけ。タブを行き来して同じ要素が置き直されても
 * 動かさない — 読んでいる位置を奪わないため。
 */
export function useFocusAnchor(): FocusAnchor {
  const scrollIntoView = useScrollIntoView();
  const ref = useRef<ViewInstance>(null);
  const hasScrolled = useRef(false);
  const onLayout = useCallback(() => {
    if (hasScrolled.current) return;
    hasScrolled.current = true;
    scrollIntoView(ref.current);
  }, [scrollIntoView]);
  return { ref, onLayout };
}

function noop() {}
