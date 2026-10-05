import type { ReactNode, Ref } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../lib/theme";
import { ChevronLeftIcon } from "./icons/icons";
import { PageTitle } from "./page-title";
import { StripeBackground } from "./stripe-background";

interface ScreenProps {
  /** 見出し（地の斜線の帯に載せる）。省略すると帯を出さない */
  readonly title?: string;
  /** 見出しの右に添える操作（ヘルプの「?」等） */
  readonly titleAction?: ReactNode;
  /** 帯の左に戻るボタンを出す */
  readonly back?: boolean;
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
 * web のスマホ幅の見た目に揃える: 上に地の斜線の帯と中央寄せの見出し、
 * その下を ink の太枠で区切った白い面。全画面で使い、余白と地の色を揃える
 * （web の `ContentContainer` + `PageTitle`）。
 */
export function Screen({
  title,
  titleAction,
  back = false,
  children,
  contentStyle,
  stickyHeaderIndices,
  ref,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useTranslations("nav");
  return (
    <View style={styles.root}>
      <View style={[styles.band, { paddingTop: insets.top + 16 }]}>
        <StripeBackground />
        {back && (
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t("back")}
            hitSlop={12}
            style={[styles.back, { top: insets.top + 14 }]}
          >
            <ChevronLeftIcon size={24} color={colors.primary700} />
          </Pressable>
        )}
        {title !== undefined && (
          <View style={styles.titleWrap}>
            <PageTitle action={titleAction}>{title}</PageTitle>
          </View>
        )}
      </View>
      <ScrollView
        ref={ref}
        style={styles.body}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  band: {
    paddingBottom: 16,
    borderBottomWidth: 4,
    borderBottomColor: colors.ink,
    backgroundColor: colors.background,
  },
  back: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  titleWrap: {
    paddingHorizontal: 48,
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
