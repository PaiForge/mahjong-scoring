import { Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { SettingsIcon } from "../../components/icons/icons";
import { Screen } from "../../components/screen";
import { useMobileJourney } from "../../dojo/use-mobile-journey";
import { NextStepCard } from "../../home/next-step-card";
import { colors } from "../../lib/theme";

/**
 * ホーム
 *
 * @description
 * web のダッシュボード（ログイン済みの「/」）に当たる、起動時の画面。黒帯への
 * 道の中で今やること 1 つを「次にやること」に出す。全体の道筋は道場が持ち、
 * ホームは「今すること」だけを答える（候補を並べない）。
 *
 * web と違うもの:
 * - 進み具合は端末に記録したレッスンの完了と「チャレンジを終えた」練習から
 *   出す（`useMobileJourney`）。段級位は持たないので、行程は常に 5級から進行中で、
 *   web が全級取得後に出す「レッスンの続き」「おすすめの練習」は出番が無い
 * - お知らせはサーバーの記事なので出さない
 * - 設定への入口をヘッダー右に置く（web はドロワー。モバイルはドロワーを持たない）
 *
 * @flow
 * 1. 「次にやること」のボタンでレッスン / 練習 / 試験へ進む
 * 2. 級の見出しで級の詳細、進み具合の各段でその段の一覧へ
 */
export default function HomeScreen() {
  const t = useTranslations("nav");
  const router = useRouter();
  const journey = useMobileJourney();

  return (
    <Screen
      title={t("home")}
      inTabs
      titleAction={
        <Pressable
          onPress={() => router.push("/preferences")}
          accessibilityRole="button"
          accessibilityLabel={t("settings")}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <SettingsIcon size={24} color={colors.surface700} />
        </Pressable>
      }
    >
      <NextStepCard journey={journey} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.5,
  },
});
