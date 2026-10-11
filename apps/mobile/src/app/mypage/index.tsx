import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { jstDayKey } from "@mahjong-scoring/features/jst";
import type { MobileMypageResponse } from "@mahjong-scoring/features/mypage/mobile-api";
import { PREFERENCES_PATH } from "@mahjong-scoring/features/routes";

import {
  ChartIcon,
  SettingsIcon,
  TrophyIcon,
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
 * - プロフィール編集を持たない。アバター・表示名・自己紹介・SNS は web の
 *   公開プロフィールに出る、他の利用者に見せる入力なので、アプリでは受け付けない
 *   （アプリで入力するのはユーザー名だけ）。web で設定したアバター・表示名は
 *   見出しに出す
 * - Pro プランと通知の行は持たない（アプリでは Pro を扱わない。通知は今の
 *   種別がすべて Pro の出来事）。アカウント（メールアドレス・ログアウト・
 *   退会）は設定のアカウントの節にあり、ここには置かない
 * - ランキングでの自分の順位への行を置く。アプリはランキングの詳細を持たず
 *   （他の利用者の名前・アバターを見せない）、練習の画面からランキングへの
 *   導線も無いので、入口をここに置く
 * - 設定への入口を置く（web はヘッダーのアカウントのメニュー。アプリはそれを
 *   マイページが兼ねる）。設定は web と同じくログイン中だけのものなので、行も
 *   ログイン中だけ出す。ユーザー名を決めていない人・アカウントを読めなかった
 *   人にも出す — ログアウトと退会がそこにある
 * - ゲストには設定の行の代わりに「その他」（利用規約・プライバシーポリシー等）を
 *   出す。ログイン中は設定の最後にあるが、ゲストは設定を開かないため
 * - ゲストとユーザー名を決めていない人にも開く。web はこの段階でマイページを
 *   開かせないが、アプリはホームのヘッダーから誰でも押せる入口を置くので、
 *   記録の案内（ホームと同じ `RecordCtaCard`）を出してログイン・登録・
 *   ユーザー名の設定へ送る。案内の下には、登録すると並ぶ中身の見本
 *   （`MypagePreview`）を淡く添える
 *
 * @flow
 * 1. ホームのヘッダー右の人型のアイコンから開く
 * 2. 段級位のピルで道場へ、アクティビティの棒でその日の内訳を見る
 * 3. 行からマイレコード・ランキングでの順位・設定へ
 * 4. ゲスト・ユーザー名を決めていない人は記録の案内から登録・ログイン・
 *    ユーザー名の設定へ
 */
export default function MypageScreen() {
  const t = useTranslations("nav");
  return (
    <Screen title={t("mypage")} back contentStyle={styles.content}>
      <MypageGate preview={<MypagePreview />}>
        {(userId) => <SignedInMypage userId={userId} />}
      </MypageGate>
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
  return <MypageBody mypage={state.value} />;
}

/** マイページの中身（見出し・アクティビティ・各機能への行） */
function MypageBody({ mypage }: { readonly mypage: MobileMypageResponse }) {
  const t = useTranslations("mypage");
  return (
    <>
      <ProfileHeading mypage={mypage} />
      <View style={styles.section}>
        <SectionTitle>{t("activityTitle")}</SectionTitle>
        <ActivityChart days={mypage.recentActivity} />
      </View>
      <MypageMenu />
    </>
  );
}

/** 見本の直近 7 日の経験値（古い順）。棒の高さに起伏が出る値 */
const PREVIEW_EXP = [40, 0, 120, 80, 0, 160, 60] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 登録すると並ぶマイページの見本
 * マイページ見本
 *
 * 記録が残らない人に、記録の案内の下へ本物の部品を淡く描いて見せる。
 * 言葉で項目を並べるより、自分の画面に何が並ぶかが一目で伝わる。値は
 * 架空なので、押せず（`pointerEvents`）、読み上げにも載せない。日付だけは
 * 開いた日までの 7 日にして、本物と同じ見え方にする。
 */
function MypagePreview() {
  const t = useTranslations("mypage.preview");
  const [now] = useState(() => Date.now());
  const mypage: MobileMypageResponse = {
    profile: { username: t("username"), displayName: t("name") },
    rankSlug: "kyu-3",
    recentActivity: PREVIEW_EXP.map((exp, index) => ({
      date: jstDayKey(
        new Date(now - (PREVIEW_EXP.length - 1 - index) * DAY_MS),
      ),
      exp,
      expByMenuType: {},
    })),
  };
  return (
    <View
      testID="mypage-preview"
      style={styles.preview}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <MypageBody mypage={mypage} />
    </View>
  );
}

/**
 * マイページの各機能への行（web の `MyPageMenu` から Pro プラン・通知・
 * アカウントを除き、ランキングでの順位を足したもの。理由は画面の TSDoc）
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
        testID="mypage-menu-ranks"
        title={t("cards.ranks.title")}
        description={t("cards.ranks.summary")}
        leading={<TrophyIcon size={22} color={colors.surface600} />}
        onPress={() => router.push("/leaderboard")}
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
  // 本物の中身と同じ間隔で並べ、淡くして見本だと分かるようにする
  preview: {
    gap: 32,
    opacity: 0.4,
  },
});
