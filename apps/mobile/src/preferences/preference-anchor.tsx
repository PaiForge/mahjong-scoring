import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import {
  View,
  type StyleProp,
  type ViewInstance,
  type ViewStyle,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  PREFERENCES_ITEM_PARAM,
  type PreferenceAnchor,
} from "@mahjong-scoring/features/settings/preference-anchors";

import { useScrollIntoView } from "../components/scroll-into-view";

interface PreferenceAnchorContextValue {
  /** URL が指す項目（`?item=`）。指していなければ undefined */
  readonly item: string | undefined;
  /** 指された項目の行が置かれた・動いたときに呼ぶ */
  readonly land: (target: ViewInstance | null) => void;
}

const PreferenceAnchorContext = createContext<
  PreferenceAnchorContextValue | undefined
>(undefined);

/**
 * 設定画面の項目への着地（web の `AnchorScroll` と `:target` の下地）
 * 設定アンカー
 *
 * `/preferences?item=renfonpai` のように項目を指して開かれたら、その行を
 * 画面の中央まで送る。行は {@link usePreferenceAnchor} で自分が指されたかを
 * 知り、web の `target:bg-brand-subtle` と同じく淡緑の地で目当ての項目を示す。
 *
 * 上にあるプライバシーの節はサーバーから読んでから高さが決まるので、行が
 * 置かれた時点の位置へ送るだけでは、読み終えたときに行が下へずれる。中身の
 * 高さが変わるたびに送り直し、利用者が画面に触れたらやめる（自分で動かした
 * 位置を奪わない）。
 *
 * ゲスト（会員限定ゲート）では項目が描かれないので、何もしない（web も
 * 未ログインでは項目へ送らない）。
 */
export function PreferenceAnchorProvider({
  style,
  children,
}: {
  readonly style?: StyleProp<ViewStyle>;
  readonly children: ReactNode;
}) {
  const params = useLocalSearchParams<{ [PREFERENCES_ITEM_PARAM]?: string }>();
  const item = params[PREFERENCES_ITEM_PARAM];
  const scrollIntoView = useScrollIntoView();
  const target = useRef<ViewInstance | null>(null);
  const touched = useRef(false);

  const land = useCallback(
    (node: ViewInstance | null) => {
      target.current = node;
      if (!touched.current) scrollIntoView(node);
    },
    [scrollIntoView],
  );
  const value = useMemo(() => ({ item, land }), [item, land]);

  return (
    <PreferenceAnchorContext.Provider value={value}>
      <View
        style={style}
        onTouchStart={() => {
          touched.current = true;
        }}
        onLayout={() => {
          if (item !== undefined) land(target.current);
        }}
      >
        {children}
      </View>
    </PreferenceAnchorContext.Provider>
  );
}

/**
 * 設定の行が URL で指されているか
 * 設定アンカーフック
 *
 * 指されていれば、行に付ける `ref` と `onLayout` を返す。{@link PreferenceAnchorProvider}
 * の外（練習の設定画面等）と、`anchor` を持たない行では常に指されていない。
 *
 * @param anchor 行の項目（web の要素の id と同じ値）
 */
export function usePreferenceAnchor(anchor: PreferenceAnchor | undefined):
  | {
      readonly ref: (node: ViewInstance | null) => void;
      readonly onLayout: () => void;
    }
  | undefined {
  const context = useContext(PreferenceAnchorContext);
  const node = useRef<ViewInstance | null>(null);
  const land = context?.land;
  const ref = useCallback((value: ViewInstance | null) => {
    node.current = value;
  }, []);
  const onLayout = useCallback(() => land?.(node.current), [land]);
  if (anchor === undefined || context?.item !== anchor) return undefined;
  return { ref, onLayout };
}
