import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { refreshAccount, useAuth } from "../../auth/use-auth";
import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { TextLink } from "../../components/text-link";
import { RecordCtaCard } from "../../home/record-cta-card";
import { colors } from "../../lib/theme";
import { ActivityChart } from "../../mypage/activity-chart";
import { ProfileHeading } from "../../mypage/profile-heading";
import { useMypage } from "../../mypage/use-mypage";

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
 *   退会）は設定のアカウントの節にあり、ゲストのログインの入口と同じ場所に
 *   そろえるため、ここには置かない
 * - ゲストとユーザー名を決めていない人にも開く。web はこの段階でマイページを
 *   開かせないが、アプリはホームのヘッダーから誰でも押せる入口を置くので、
 *   記録の案内（ホームと同じ `RecordCtaCard`）を出してログイン・登録・
 *   ユーザー名の設定へ送る
 *
 * @flow
 * 1. ホームのヘッダー右の人型のアイコンから開く
 * 2. 段級位のピルで道場へ、アクティビティの棒でその日の内訳を見る
 * 3. ゲスト・ユーザー名を決めていない人は記録の案内から登録・ログイン・
 *    ユーザー名の設定へ
 */
export default function MypageScreen() {
  const t = useTranslations("nav");
  return (
    <Screen title={t("mypage")} back contentStyle={styles.content}>
      <MypageBody />
    </Screen>
  );
}

function MypageBody() {
  const { status, user, account, accountError } = useAuth();
  if (status === "signedOut") return <RecordCtaCard testIDPrefix="mypage" />;
  if (status !== "signedIn" || user === undefined) return <Loading />;
  if (account === undefined) {
    return accountError === undefined ? (
      <Loading />
    ) : (
      <AccountLoadFailed banned={accountError === "banned"} />
    );
  }
  if (account.profile === null) return <RecordCtaCard testIDPrefix="mypage" />;
  // ユーザーが変わったら前のユーザーの値を持ち越さない
  return <SignedInMypage key={user.id} userId={user.id} />;
}

function SignedInMypage({ userId }: { readonly userId: string }) {
  const t = useTranslations("mypage");
  const { state, reload } = useMypage(userId);
  if (state.kind === "loading") return <Loading />;
  if (state.kind === "failed") {
    return (
      <View style={styles.failed}>
        <Text style={styles.failedText}>{t("loadFailed")}</Text>
        <TextLink onPress={reload}>{t("retry")}</TextLink>
      </View>
    );
  }
  return (
    <>
      <ProfileHeading mypage={state.mypage} />
      <View style={styles.section}>
        <SectionTitle>{t("activityTitle")}</SectionTitle>
        <ActivityChart days={state.mypage.recentActivity} />
      </View>
    </>
  );
}

/**
 * アカウント状態を読めなかったとき。BAN 中はその旨だけ（ログアウトと退会は
 * 設定のアカウントの節から）
 */
function AccountLoadFailed({ banned }: { readonly banned: boolean }) {
  const t = useTranslations("settings.account");
  return (
    <View style={styles.failed}>
      <Text style={styles.failedText}>
        {banned ? t("banned") : t("loadFailed")}
      </Text>
      {!banned && (
        <TextLink onPress={() => void refreshAccount()}>{t("retry")}</TextLink>
      )}
    </View>
  );
}

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary500} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  section: {
    gap: 16,
  },
  loading: {
    paddingVertical: 48,
    alignItems: "center",
  },
  failed: {
    alignItems: "flex-start",
    gap: 4,
  },
  failedText: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.destructiveStrong,
  },
});
