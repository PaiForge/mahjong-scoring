import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";

import { Screen } from "../../components/screen";
import { colors } from "../../lib/theme";

/**
 * 練習を始める前の準備中の画面
 * 練習準備中画面
 *
 * 練習名の見出しと閉じるボタンだけを持ち、中央で待つ。記録付きチャレンジの
 * アカウントとサーバーの確認、手牌の見せ方の準備が終わるまでの間に出す。
 */
export function PreparingScreen({ slug }: { readonly slug: PracticeMenuSlug }) {
  const t = useTranslations(practiceMenuBySlug(slug).namespace);
  return <PreparingScreenFrame title={t("title")} />;
}

/**
 * 練習準備中画面の枠（見出しを直接渡す）
 *
 * 練習一覧のレジストリに載らない無限訓練（和了形・聴牌形の点数計算）用。
 */
export function PreparingScreenFrame({ title }: { readonly title: string }) {
  return (
    <Screen title={title} back backIcon="close">
      <View style={styles.center}>
        <ActivityIndicator color={colors.action} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: 48,
    alignItems: "center",
  },
});
