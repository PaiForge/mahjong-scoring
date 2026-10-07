import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { ScrollView, View, type StyleProp, type ViewStyle } from "react-native";

/** 渡した要素がスクロール枠の縦の中央に来るまでスクロールする関数 */
type ScrollIntoView = (target: View | null) => void;

const ScrollIntoViewContext = createContext<ScrollIntoView | undefined>(
  undefined,
);

/**
 * 子孫から「ここを見せて」と頼めるスクロール枠
 * 中央寄せスクロール
 *
 * web の `scrollIntoView({ block: "center" })` に当たる。中身の要素は自分が
 * どのスクロール枠に入っているかを知らないので、枠がコンテキストで
 * スクロールの関数を配り、子孫（点数早見表の注目セル）がそれを呼ぶ。
 */
export function ScrollIntoViewScrollView({
  style,
  children,
}: {
  readonly style?: StyleProp<ViewStyle>;
  readonly children: ReactNode;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const viewportHeight = useRef(0);

  const scrollIntoView = useCallback<ScrollIntoView>((target) => {
    const content = contentRef.current;
    if (target === null || content === null) return;
    target.measureLayout(content, (_x, y, _width, height) => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, y + height / 2 - viewportHeight.current / 2),
        animated: true,
      });
    });
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      style={style}
      onLayout={(e) => {
        viewportHeight.current = e.nativeEvent.layout.height;
      }}
    >
      <View ref={contentRef} collapsable={false}>
        <ScrollIntoViewContext.Provider value={scrollIntoView}>
          {children}
        </ScrollIntoViewContext.Provider>
      </View>
    </ScrollView>
  );
}

/**
 * 囲んでいる {@link ScrollIntoViewScrollView} のスクロール関数
 *
 * 枠の外では何もしない関数を返す（点数早見表はタブの画面にも置かれ、
 * そこでは注目セルを持たない）。
 */
export function useScrollIntoView(): ScrollIntoView {
  return useContext(ScrollIntoViewContext) ?? noop;
}

function noop() {}
