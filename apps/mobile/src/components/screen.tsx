import { useCallback, useRef, type ReactNode, type Ref } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PRACTICE_PATH } from "@mahjong-scoring/features/routes";

import { colors } from "../lib/theme";
import { ChevronLeftIcon, CloseIcon } from "./icons/icons";
import { ScrollIntoViewProvider } from "./scroll-into-view";

/** ヘッダーの高さ（ステータスバーを除く）。iOS / Android の標準に合わせる */
const HEADER_HEIGHT = 48;

/** ヘッダー左右の操作の幅。44pt 以上の当たり判定を確保する */
const HEADER_SLOT_WIDTH = 48;

interface ScreenProps {
  /** 見出し（ヘッダー中央に出す）。省略するとヘッダーを出さない */
  readonly title?: string;
  /** ヘッダー右端に置く操作（ヘルプの「?」等） */
  readonly titleAction?: ReactNode;
  /** ヘッダー左端に戻るボタンを出す */
  readonly back?: boolean;
  /**
   * 戻るボタンの動作の上書き
   *
   * 既定はスタックを 1 つ戻る。解答中の画面のように「戻る = 終了」で確認を
   * 挟むときや、戻る先を説明画面に固定したいときに渡す。
   */
  readonly onBack?: () => void;
  /**
   * 戻るボタンの形。`close`（×）は、戻るのではなく「今の流れを閉じる」画面
   * （チャレンジ・トレーニング・訓練の盤面）に使う
   */
  readonly backIcon?: "chevron" | "close";
  /**
   * 下部タブの中の画面か
   *
   * タブの中ではタブバーが画面下端のセーフエリアを受け持つので、本文の
   * 下の余白にセーフエリアを足さない（足すとホームインジケータの高さぶん
   * 余計に空く）。タブの上に積む画面は本文が画面下端まで届くので足す
   */
  readonly inTabs?: boolean;
  readonly children: ReactNode;
  readonly contentStyle?: StyleProp<ViewStyle>;
  /**
   * スクロールしても上端に追従させる子の位置（`ScrollView` の同名 prop）。
   * 数えるのは `children` に直接並べた要素
   */
  readonly stickyHeaderIndices?: readonly number[];
  /** 本文の `ScrollView`。呼び出し側が先頭へ戻すとき等に使う */
  readonly ref?: Ref<ScrollView>;
}

/**
 * 画面の枠
 * コンテンツ枠
 *
 * ネイティブアプリの標準の画面構成: 上にヘッダー（左に戻る・中央に見出し・
 * 右に操作）、その下に白い本文がスクロールする。全画面で使い、余白と地の色を
 * そろえる。web の地の斜線の帯と太枠の区切りは持たない — スマホアプリの
 * ヘッダーとして見慣れない形で、本文の面積も削るため。
 *
 * 戻るは履歴が無いとき（ディープリンクや再起動で直接開いたとき）でも
 * 練習一覧へ戻れるようにする。
 */
export function Screen({
  title,
  titleAction,
  back = false,
  onBack,
  backIcon = "chevron",
  inTabs = false,
  children,
  contentStyle,
  stickyHeaderIndices,
  ref,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  // 子孫が「ここを見せて」と頼めるよう、本文の枠を手元でも持つ
  const scrollRef = useRef<ScrollView>(null);
  const viewportHeight = useRef(0);
  const setScrollRef = useCallback(
    (node: ScrollView | null) => {
      scrollRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref != null) ref.current = node;
    },
    [ref],
  );
  const router = useRouter();
  const t = useTranslations("nav");

  const handleBack = () => {
    if (onBack !== undefined) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(PRACTICE_PATH);
    }
  };

  return (
    <View style={styles.root}>
      {title !== undefined && (
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <View style={styles.slot}>
              {back && (
                <Pressable
                  onPress={handleBack}
                  accessibilityRole="button"
                  accessibilityLabel={
                    backIcon === "close" ? t("close") : t("back")
                  }
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.headerButton,
                    pressed && styles.headerButtonPressed,
                  ]}
                >
                  {backIcon === "close" ? (
                    <CloseIcon size={24} color={colors.surface700} />
                  ) : (
                    <ChevronLeftIcon size={26} color={colors.surface700} />
                  )}
                </Pressable>
              )}
            </View>
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              style={styles.title}
            >
              {title}
            </Text>
            <View style={[styles.slot, styles.slotEnd]}>{titleAction}</View>
          </View>
        </View>
      )}
      <ScrollIntoViewProvider
        scrollRef={scrollRef}
        viewportHeight={viewportHeight}
      >
        <ScrollView
          ref={setScrollRef}
          onLayout={(e) => {
            viewportHeight.current = e.nativeEvent.layout.height;
          }}
          style={styles.body}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: (inTabs ? 0 : insets.bottom) + 32 },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          stickyHeaderIndices={
            stickyHeaderIndices === undefined
              ? undefined
              : [...stickyHeaderIndices]
          }
        >
          {children}
        </ScrollView>
      </ScrollIntoViewProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.card,
  },
  header: {
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surface300,
  },
  headerRow: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  slot: {
    width: HEADER_SLOT_WIDTH,
    height: HEADER_HEIGHT,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  slotEnd: {
    alignItems: "flex-end",
    paddingRight: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonPressed: {
    backgroundColor: colors.surface100,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  body: {
    flex: 1,
    backgroundColor: colors.card,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 24,
  },
});
