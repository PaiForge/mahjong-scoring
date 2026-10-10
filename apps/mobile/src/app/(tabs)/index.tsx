import { Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { UserIcon } from "../../components/icons/icons";
import { Screen } from "../../components/screen";
import { useMobileJourney } from "../../dojo/use-mobile-journey";
import { HomeAnnouncements } from "../../home/home-announcements";
import { NextStepCard } from "../../home/next-step-card";
import { RecordCtaCard } from "../../home/record-cta-card";
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
 * - 進み具合はログイン中ならサーバーの記録と端末の未送信・ゲストの記録、
 *   ゲストなら端末の記録から出す（`useMobileJourney`）。web が全級取得後に
 *   出す「レッスンの続き」「おすすめの練習」はまだ持たない（全級取得済みの
 *   アカウントでは「次にやること」が出ない）
 * - お知らせは「次にやること」と記録の案内の後に置く（web は学習導線の後）
 * - マイページへの入口をヘッダー右に置く（web はヘッダーのアカウントの
 *   メニュー。モバイルはメニューを持たず、タブも OS の上限の 5 つで
 *   埋まっている）。マイページはゲストにも出す — 開くと記録の案内が出る。
 *   設定は web のアカウントのメニューと同じくマイページの奥に置き、ヘッダーに
 *   歯車を常に出さない（web もヘッダーに設定を常設しない）
 * - ゲストにも開く画面なので、記録が残らない人（ゲスト・ユーザー名を
 *   決めていない人）には「次にやること」の下に記録の案内を出す
 *   （`RecordCtaCard`）。今することを先に置き、案内はその後
 *
 * @flow
 * 1. 「次にやること」のボタンでレッスン / 練習 / 試験へ進む
 * 2. 級の見出しで級の詳細、進み具合の各段でその段の一覧へ
 * 3. ゲストは記録の案内から登録・ログインへ、ユーザー名を決めていない人は
 *    ユーザー名の設定へ進む
 * 4. お知らせの行で詳細、「すべて見る」で一覧へ
 */
export default function HomeScreen() {
  const t = useTranslations("nav");
  const router = useRouter();
  const journey = useMobileJourney();

  return (
    <Screen
      title={t("home")}
      inTabs
      contentStyle={styles.content}
      titleAction={
        <Pressable
          testID="home-mypage"
          onPress={() => router.push("/mypage")}
          accessibilityRole="button"
          accessibilityLabel={t("mypage")}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <UserIcon size={24} color={colors.surface700} />
        </Pressable>
      }
    >
      <NextStepCard journey={journey} />
      <RecordCtaCard />
      <HomeAnnouncements />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  pressed: {
    opacity: 0.5,
  },
});
