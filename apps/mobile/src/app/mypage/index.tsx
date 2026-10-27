import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View, type ScrollViewInstance } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { jstDayKey } from "@mahjong-scoring/features/jst";
import type { MobileMypageResponse } from "@mahjong-scoring/features/mypage/mobile-api";
import {
  LEADERBOARD_PATH,
  MY_RECORD_PATH,
  MYPAGE_NOTIFICATIONS_PATH,
  MYPAGE_PLAN_PATH,
  PREFERENCES_PATH,
} from "@mahjong-scoring/features/routes";

import { IAP_AVAILABLE } from "../../billing/iap-availability";
import {
  BellIcon,
  ChartIcon,
  SettingsIcon,
  StarIcon,
  TrophyIcon,
  UserIcon,
} from "../../components/icons/icons";
import { LinkRow, LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { useAuth } from "../../auth/use-auth";
import { colors } from "../../lib/theme";
import { DeletionNoticePanel } from "../../mypage/account-section";
import { ActivityChart } from "../../mypage/activity-chart";
import { ProfileHeading } from "../../mypage/profile-heading";
import { fetchMypage } from "../../mypage/mypage-api";
import { MypageGate, MypageLoadFailed } from "../../mypage/mypage-gate";
import { LoadingIndicator } from "../../components/load-state";
import { useMypageRead } from "../../mypage/use-mypage-read";
import { UnreadCountBadge } from "../../notifications/unread-count-badge";
import { SiteLinksSection } from "../../mypage/site-links-section";

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
 * - Pro プランと通知の行は iOS だけ — Android は Pro を扱わない（購入・表示・
 *   回数制限のどれも出さない。Play Billing の実装は別の仕事）。通知の種別は
 *   今はすべて Pro の出来事（購入・期限切れ・付与・取り消し。App Store での
 *   購入・取り消しも通知になる）なので、Pro を出さない Android には中身が無い
 * - web のヘッダーのベル（未読の件数）は持たない。アプリのヘッダーには置かず、
 *   未読の件数は「通知」の行の行末に出す（マイページを開くたびに読み直す）
 * - ランキングでの自分の順位への行を置く。アプリはランキングの詳細を持たず
 *   （他の利用者の名前・アバターを見せない）、練習の画面からランキングへの
 *   導線も無いので、入口をここに置く
 * - アカウント（web と同じくマイページから開く。ログアウトもそこにある）と
 *   設定（web はヘッダーのアカウントのメニュー。アプリはそれをマイページが
 *   兼ねる）の行を、記録の行とは別の枠でログイン中だけ出す。ユーザー名を
 *   決めていない人・アカウントを読めなかった人にも出す — ログアウトと退会が
 *   アカウントにある
 * - 退会した後はゲストとしてここへ戻るので、受け付けた知らせを先頭に出す
 * - ログアウト・退会でゲストに戻ったら先頭へ戻す。アカウントの行まで送った位置の
 *   ままだと、先頭の記録の案内が画面の外にあり、淡い見本だけが途中から見える
 * - 末尾に「その他」（利用規約・プライバシーポリシー等の web のページ）を、
 *   ゲストにもログイン中の人にも出す。web のフッターに当たる場所がアプリには
 *   無く、マイページがその役を兼ねる（設定には置かない。理由は `SiteLinksSection`）
 * - ゲストとユーザー名を決めていない人にも開く。web はこの段階でマイページを
 *   開かせないが、アプリはホームのヘッダーから誰でも押せる入口を置くので、
 *   記録の案内（ホームと同じ `RecordCtaCard`）を出してログイン・登録・
 *   ユーザー名の設定へ送る。案内の下には、登録すると並ぶ中身の見本
 *   （`MypagePreview`）を淡く添える
 *
 * @flow
 * 1. ホームのヘッダー右の人型のアイコンから開く
 * 2. 段級位のピルで道場へ、アクティビティの棒でその日の内訳を見る
 * 3. 行からマイレコード・ランキングでの順位・Pro プラン（iOS）・通知（iOS）・
 *    アカウント・設定・web のページ（規約等）へ
 * 4. ゲスト・ユーザー名を決めていない人は記録の案内から登録・ログイン・
 *    ユーザー名の設定へ
 */
export default function MypageScreen() {
  const t = useTranslations("nav");
  const scrollRef = useRef<ScrollViewInstance>(null);
  const { status } = useAuth();
  // この画面はアカウントの画面の下に残っているので、戻る前に先頭へ送っておく
  const previousStatus = useRef(status);
  useEffect(() => {
    if (previousStatus.current === "signedIn" && status === "signedOut")
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    previousStatus.current = status;
  }, [status]);
  return (
    <Screen
      title={t("mypage")}
      back
      contentStyle={styles.content}
      ref={scrollRef}
    >
      <DeletionNoticePanel />
      <MypageGate preview={<MypagePreview />}>
        {(userId) => <SignedInMypage userId={userId} />}
      </MypageGate>
      <AccountEntries />
      <SiteLinksSection />
    </Screen>
  );
}

function SignedInMypage({ userId }: { readonly userId: string }) {
  const t = useTranslations("mypage");
  const { state, reload } = useMypageRead(
    useCallback(() => fetchMypage(userId), [userId]),
  );
  if (state.kind === "loading") return <LoadingIndicator />;
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
      <MypageMenu unreadNotificationCount={mypage.unreadNotificationCount} />
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
 * マイページの各機能への行（web の `MyPageMenu` からアカウントを除き、
 * ランキングでの順位を足したもの。Pro プランと通知は iOS だけ。理由は画面の TSDoc）
 *
 * @param unreadNotificationCount - 未読の通知の件数。1 以上なら通知の行末に出す
 */
function MypageMenu({
  unreadNotificationCount = 0,
}: {
  readonly unreadNotificationCount?: number;
}) {
  const t = useTranslations("mypage");
  const tNotifications = useTranslations("notifications");
  const router = useRouter();
  return (
    <LinkRowList>
      <LinkRow
        testID="mypage-menu-challenges"
        title={t("cards.challenges.title")}
        description={t("cards.challenges.summary")}
        leading={<ChartIcon size={22} color={colors.surface600} />}
        onPress={() => router.push(MY_RECORD_PATH)}
      />
      <LinkRow
        testID="mypage-menu-ranks"
        title={t("cards.ranks.title")}
        description={t("cards.ranks.summary")}
        leading={<TrophyIcon size={22} color={colors.surface600} />}
        onPress={() => router.push(LEADERBOARD_PATH)}
      />
      {IAP_AVAILABLE && (
        <LinkRow
          testID="mypage-menu-plan"
          title={t("cards.plan.title")}
          description={t("cards.plan.summary")}
          leading={<StarIcon size={22} color={colors.surface600} />}
          onPress={() => router.push(MYPAGE_PLAN_PATH)}
        />
      )}
      {IAP_AVAILABLE && (
        <LinkRow
          testID="mypage-menu-notifications"
          title={t("cards.notifications.title")}
          description={t("cards.notifications.summary")}
          leading={<BellIcon size={22} color={colors.surface600} />}
          trailing={
            unreadNotificationCount > 0 ? (
              <UnreadCountBadge count={unreadNotificationCount} />
            ) : undefined
          }
          accessibilityLabel={
            unreadNotificationCount > 0
              ? tNotifications("bellUnread", {
                  count: unreadNotificationCount,
                })
              : undefined
          }
          onPress={() => router.push(MYPAGE_NOTIFICATIONS_PATH)}
        />
      )}
    </LinkRowList>
  );
}

/**
 * アカウントと設定の行（ログイン中だけ）。ログインを出せないビルドは
 * アカウントが無く設定にゲートが掛からないので、設定の行だけを出す
 */
function AccountEntries() {
  const t = useTranslations("nav");
  const tMypage = useTranslations("mypage");
  const router = useRouter();
  const { status } = useAuth();
  if (status === "loading" || status === "signedOut") return null;
  return (
    <LinkRowList>
      {status === "signedIn" && (
        <LinkRow
          testID="mypage-menu-account"
          title={tMypage("cards.account.title")}
          leading={<UserIcon size={22} color={colors.surface600} />}
          onPress={() => router.push("/mypage/account")}
        />
      )}
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
