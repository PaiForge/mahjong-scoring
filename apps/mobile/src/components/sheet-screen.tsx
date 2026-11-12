import { useCallback, type ReactNode, type Ref } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useNavigation, usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";

import { useHardwareBack } from "../hooks/use-hardware-back";
import { useCloseModal, useOpenFromModal } from "../hooks/use-open-from-modal";
import { backFallbackHref } from "../lib/back-fallback";
import { findRouteIndexByHref } from "../lib/route-pathname";
import { HEADER_TITLE_STYLE } from "../lib/stack-options";
import { colors } from "../lib/theme";
import { SymbolIcon } from "./icons/symbol-icon";

/** 本文の下の余白（下端の safe area は別に足す） */
const CONTENT_PADDING_BOTTOM = 32;

interface SheetScreenProps {
  /** 見出し（シートの上端の行の左に出す） */
  readonly title: string;
  readonly children: ReactNode;
  /** 本文の枠（見出しの行の下）のスタイル。既定は左右 16pt の余白と 24pt の間隔 */
  readonly contentStyle?: StyleProp<ViewStyle>;
  /** 本文の `ScrollView`。中身を差し替えて先頭へ戻すとき等に使う */
  readonly ref?: Ref<ScrollViewInstance>;
}

/**
 * シートの枠
 * 詳細のシート
 *
 * 用語（`reference/glossary/[slug]`）・お知らせ（`announcements/[slug]`）・
 * 級の詳細（`dojo/ranks/[slug]`）の 3 画面だけが使う。この 3 つはルートの
 * スタックに `presentation: "formSheet"`（高さは半分と全画面の 2 段、取っ手あり、
 * OS のヘッダーなし）で載る。シートにする基準は「読んで閉じる。開いた場所を
 * 失わせない。多くの場所から開く」。役一覧・用語集の一覧・レッスン・練習の
 * 説明は行き来の起点なのでシートにせず通常の画面で積み、設定・認証は
 * `(account)` のモーダルの組に入れる。
 *
 * 見出しと閉じる（×、`sheet-close`）はこの部品が自前で描く。Android の
 * formSheet はヘッダーも中のスタックも持てない（detent も 3 つまで）ため、
 * OS のヘッダー（`Screen`）に頼らず両 OS で同じ枠にする。
 *
 * 本文の `ScrollView` は画面の直下の最初の子に置く（見出しの行もその中に入れ、
 * 上端に追従させる）。iOS は、シートの最初の子がスクロールする view のときだけ、
 * 下へのスクロールとシートの高さの切り替え（detent）を受け渡す — 間に view を
 * 挟むと、半分の高さのまま本文だけが動き、全画面へ広げられない。Android は
 * シートの中で入れ子のスクロールを有効にする（`nestedScrollEnabled`）。
 * シートの下端は画面の下端に接するので、下端の safe area は手で足す。
 *
 * × と Android の戻るは、いちばん上のモーダル（このシート）を 1 つ閉じる
 * （`useCloseModal`）。ディープリンクで直接開いて下に画面が無いときは、
 * 入口（`backFallbackHref`）へ置き換える。
 *
 * シートの中から、モーダルでない画面（レッスン・練習の説明等）へ進むときは
 * `useOpenFromModal` を使う。iOS ではモーダルの後に積んだ通常の画面はモーダルの
 * 下に入って見えないため、上に重なったモーダルをすべて閉じてから積む。
 * 用語の「関連する用語」は、シートを積み重ねず `router.setParams({ slug })` で
 * 中身を替える（閉じるたびに 1 語ずつ戻る深い重なりを作らない）。
 */
export function SheetScreen({
  title,
  children,
  contentStyle,
  ref,
}: SheetScreenProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const closeModal = useCloseModal();
  const t = useTranslations("nav");
  const close = useCallback(
    () => closeModal(backFallbackHref(pathname)),
    [closeModal, pathname],
  );
  useHardwareBack(close);

  return (
    <ScrollView
      ref={ref}
      style={styles.body}
      // 下端の safe area は手で足すので、OS に inset を足させない（二重になる）
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{
        paddingBottom: CONTENT_PADDING_BOTTOM + insets.bottom,
      }}
      stickyHeaderIndices={HEADING_INDICES}
      nestedScrollEnabled={Platform.OS === "android"}
      keyboardShouldPersistTaps="handled"
    >
      {/* 追従する子は外と内の 2 枚に分ける（理由は styles.headingBar） */}
      <View style={styles.headingBar}>
        <View style={styles.headingRow}>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            style={styles.title}
          >
            {title}
          </Text>
          <Pressable
            testID="sheet-close"
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel={t("close")}
            hitSlop={8}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          >
            <SymbolIcon name="close" size={18} color={colors.foreground} />
          </Pressable>
        </View>
      </View>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </ScrollView>
  );
}

/** 見出しの行（`ScrollView` の最初の子）を上端に追従させる */
const HEADING_INDICES = [0];

/**
 * シートから一覧（用語集・お知らせの一覧）へ戻る
 * 一覧へ戻る
 *
 * ルートのスタックの下に一覧があれば、そこまで閉じるだけにする（一覧を
 * もう 1 枚積むと、戻ったときに同じ一覧が 2 回出る）。無ければ一覧を開く。
 * シートの上に通常の画面は積めないので、開くのは `useOpenFromModal`
 * （シートを閉じてから積む）。
 *
 * 一覧が履歴に無いときに `router.dismissTo` を使わないのは、見つからないと
 * 今の画面を置き換え、一覧から戻ったときにこのシートを飛ばすため。
 *
 * @returns 一覧のパス（`/reference/glossary` 等）を受けて戻る関数
 */
export function useReturnToIndex(): (indexHref: string) => void {
  const router = useRouter();
  const navigation = useNavigation();
  const openFromModal = useOpenFromModal();
  return useCallback(
    (indexHref: string) => {
      const state = navigation.getState();
      const inHistory =
        state !== undefined &&
        findRouteIndexByHref(state.routes, state.index, indexHref) !==
          undefined;
      if (inHistory) router.dismissTo(indexHref);
      else openFromModal(indexHref);
    },
    [router, navigation, openFromModal],
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: colors.card,
  },
  /**
   * 見出しの行の外側（`ScrollView` が上端に追従させる子）。地の色と余白だけを持つ
   *
   * RN の `ScrollView` は追従させる子を `Animated.View` で包み、子に渡した
   * `style` をその包みへ移して、子自身には `{ flex: 1 }` だけを当て直す
   * （`ScrollViewStickyHeader`）。並びの指定（`flexDirection: "row"` 等）を
   * 追従させる子に直接書くと、包みが行になり、子は既定の縦並びに戻って
   * × が見出しの下へ落ちる。移されても見た目の変わらない地の色と余白だけを
   * 外側に置き、並びは内側の {@link styles.headingRow} に持たせる。
   */
  headingBar: {
    // 上端は iOS の取っ手のぶん空ける
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
  },
  /** 見出しの行の内側。左に見出し、右に × を 1 行に並べる */
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    ...HEADER_TITLE_STYLE,
    flex: 1,
    minWidth: 0,
  },
  close: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.5,
  },
  content: {
    paddingTop: 8,
    paddingHorizontal: 16,
    gap: 24,
  },
});
