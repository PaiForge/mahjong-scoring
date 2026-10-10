import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { PREFERENCES_PATH } from "@mahjong-scoring/features/routes";

import {
  ChartIcon,
  SettingsIcon,
  UserIcon,
} from "../../components/icons/icons";
import { LinkRow, LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { useAuth } from "../../auth/use-auth";
import { colors } from "../../lib/theme";
import { ActivityChart } from "../../mypage/activity-chart";
import { ProfileHeading } from "../../mypage/profile-heading";
import { fetchMypage } from "../../mypage/mypage-api";
import {
  MypageGate,
  MypageLoadFailed,
  MypageLoading,
} from "../../mypage/mypage-gate";
import { useMypageRead } from "../../mypage/use-mypage-read";
import { SiteLinksSection } from "../../preferences/site-links-section";

/**
 * マイページ
 *
 * @description
 * web のマイページのトップ（`/mypage`）。プロフィールの見出しと、直近の
 * 経験値のアクティビティを出す。
 *
 * web と違うもの:
 * - アクティビティは web のスマホ幅と同じ直近 7 日の棒グラフだけ（PC 幅の
 *   46 週の格子は持たない）
 * - Pro プランと通知の行は持たない（アプリでは Pro を扱わない。通知は今の
 *   種別がすべて Pro の出来事）。アカウント（メールアドレス・ログアウト・
 *   退会）は設定のアカウントの節にあり、ここには置かない
 * - 設定への入口を置く（web はヘッダーのアカウントのメニュー。アプリはそれを
 *   マイページが兼ねる）。設定は web と同じくログイン中だけのものなので、行も
 *   ログイン中だけ出す。ユーザー名を決めていない人・アカウントを読めなかった
 *   人にも出す — ログアウトと退会がそこにある
 * - ゲストには設定の行の代わりに「その他」（利用規約・プライバシーポリシー等）を
 *   出す。ログイン中は設定の最後にあるが、ゲストは設定を開かないため
 * - ゲストとユーザー名を決めていない人にも開く。web はこの段階でマイページを
 *   開かせないが、アプリはホームのヘッダーから誰でも押せる入口を置くので、
 *   記録の案内（ホームと同じ `RecordCtaCard`）を出してログイン・登録・
 *   ユーザー名の設定へ送る
 *
 * @flow
 * 1. ホームのヘッダー右の人型のアイコンから開く
 * 2. 段級位のピルで道場へ、アクティビティの棒でその日の内訳を見る
 * 3. 行からマイレコード・プロフィール編集・設定へ
 * 4. ゲスト・ユーザー名を決めていない人は記録の案内から登録・ログイン・
 *    ユーザー名の設定へ
 */
export default function MypageScreen() {
  const t = useTranslations("nav");
  return (
    <Screen title={t("mypage")} back contentStyle={styles.content}>
      <MypageGate>{(userId) => <SignedInMypage userId={userId} />}</MypageGate>
      <SettingsEntry />
    </Screen>
  );
}

function SignedInMypage({ userId }: { readonly userId: string }) {
  const t = useTranslations("mypage");
  const { state, reload } = useMypageRead(
    useCallback(() => fetchMypage(userId), [userId]),
  );
  if (state.kind === "loading") return <MypageLoading />;
  if (state.kind === "failed")
    return <MypageLoadFailed message={t("loadFailed")} onRetry={reload} />;
  return (
    <>
      <ProfileHeading mypage={state.value} />
      <View style={styles.section}>
        <SectionTitle>{t("activityTitle")}</SectionTitle>
        <ActivityChart days={state.value.recentActivity} />
      </View>
      <MypageMenu />
    </>
  );
}

/**
 * マイページの各機能への行（web の `MyPageMenu` から Pro プラン・通知・
 * アカウントを除いたもの。除いた理由は画面の TSDoc）。プロフィール編集は
 * web では見出しのカードのボタンだが、アプリでは機能の行と並べる
 */
function MypageMenu() {
  const t = useTranslations("mypage");
  const router = useRouter();
  return (
    <LinkRowList>
      <LinkRow
        testID="mypage-menu-challenges"
        title={t("cards.challenges.title")}
        description={t("cards.challenges.summary")}
        leading={<ChartIcon size={22} color={colors.surface600} />}
        onPress={() => router.push("/mypage/challenges")}
      />
      <LinkRow
        testID="mypage-menu-profile"
        title={t("cards.profile.title")}
        description={t("cards.profile.summary")}
        leading={<UserIcon size={22} color={colors.surface600} />}
        onPress={() => router.push("/mypage/profile/edit")}
      />
    </LinkRowList>
  );
}

/**
 * 設定の行（ログイン中）/ web のページへの入口（ゲスト）。ログインを出せない
 * ビルドは設定にゲートが掛からないので、行を出す
 */
function SettingsEntry() {
  const t = useTranslations("nav");
  const router = useRouter();
  const { status } = useAuth();
  if (status === "loading") return null;
  if (status === "signedOut") return <SiteLinksSection />;
  return (
    <LinkRowList>
      <LinkRow
        testID="mypage-menu-settings"
        title={t("settings")}
        leading={<SettingsIcon size={22} color={colors.surface600} />}
        onPress={() => router.push(PREFERENCES_PATH)}
      />
    </LinkRowList>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  section: {
    gap: 16,
  },
});
