import { MYPAGE_PATH } from "@mahjong-scoring/features/routes";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { selectDashboardGuidance } from "@mahjong-scoring/features/dashboard/guidance";

import { useAuth } from "../../../auth/use-auth";
import { HeaderIconButton } from "../../../components/header-action";
import { UserIcon } from "../../../components/icons/icons";
import { SymbolIcon } from "../../../components/icons/symbol-icon";
import { Screen } from "../../../components/screen";
import { AgariScorePracticeSection } from "../../../home/agari-score-practice-section";
import { ContinueLearningSection } from "../../../home/continue-learning-section";
import { DailyProblemSection } from "../../../home/daily-problem-section";
import { HomeAnnouncements } from "../../../home/home-announcements";
import { HomeNotifications } from "../../../home/home-benefit-grant-card";
import { NextStepCard } from "../../../home/next-step-card";
import { RecordCtaCard } from "../../../home/record-cta-card";
import { UNPORTED_LESSON_SLUGS } from "../../../lessons/ported-lessons";
import { colors } from "../../../lib/theme";
import { UserAvatar } from "../../../mypage/user-avatar";
import { UnreadCountBadge } from "../../../notifications/unread-count-badge";
import { useUnreadNotifications } from "../../../notifications/unread-notifications";
import { useAccountProgress } from "../../../records/use-account-progress";

/**
 * ヘッダー右のアバターの直径。人型のアイコン（24）より一回り大きくし、
 * 塗りの円と線画のアイコンの見た目の大きさをそろえる
 */
const ENTRY_SIZE = 28;

/**
 * ホーム
 *
 * @description
 * web のダッシュボード（ログイン済みの「/」）に当たる、起動時の画面。黒帯への
 * 道の中で今やること 1 つを「次にやること」に出す。全体の道筋は道場が持ち、
 * ホームは「今すること」だけを答える（候補を並べない）。全級取得済みの人には
 * 「次にやること」が無いので、代わりに「レッスンの続き」（未完了のレッスンが
 * 残っていれば）と「おすすめの練習」（和了形の点数計算）を出す。出し分けは
 * web と同じ features の `selectDashboardGuidance` が決める。
 *
 * 「次にやること」の直下に「本日の問題」（全員に同じ和了形の点数計算 1 問。
 * `DailyProblemSection`）を置く。主役は「次にやること」のままで、日課は別の軸
 * として直下に並べる（web のダッシュボードと同じ並び）。本日の問題を読めな
 * かったとき・今日は問題が無いときはカードだけを出さず、ホームの他の節はその
 * まま出す。カードはログイン中だけ — ホームはゲストにも開く画面だが、ゲストに
 * 出すには端末側に「解答済み」を残す仕組みが要り、初版の範囲を超える（ゲストには
 * API も呼ばない）。
 *
 * web と違うもの:
 * - 進み具合はログイン中ならサーバーの記録と端末の未送信・ゲストの記録、
 *   ゲストなら端末の記録から出す（`useAccountProgress`）。「レッスンの続き」は
 *   モバイルで開けるレッスンだけから選ぶ（レッスンの目次と同じ）
 * - お知らせは学習導線と記録の案内の後に置く（web は学習導線の後）
 * - マイページへの入口をヘッダー右に置く（`HeaderIconButton`。web はヘッダーのアカウントの
 *   メニュー。モバイルはメニューを持たず、タブも OS の上限の 5 つで
 *   埋まっている）。マイページはゲストにも出す — 開くと記録の案内が出る。
 *   設定は web のアカウントのメニューと同じくマイページの奥に置き、ヘッダーに
 *   歯車を常に出さない（web もヘッダーに設定を常設しない）。アバター画像を
 *   設定した人にはアイコンの代わりにその画像を出す（スマホアプリで見慣れた
 *   形）。画像の無い人は頭文字ではなく人型のアイコンのまま — `/me` は表示名を
 *   持たず、マイページの見出しの頭文字と食い違うため
 * - ログイン中の iOS では、未読の通知の件数をヘッダーのアバターにバッジで重ね、
 *   未読の「運営から Pro が付与された」通知があれば先頭にそのカードを出す
 *   （`HomeNotifications`。通知はマイページの奥にあり、付与に気づかれなかった。
 *   web はヘッダーに通知のベルを常に出す）
 * - ゲストにも開く画面なので、記録が残らない人（ゲスト・ユーザー名を
 *   決めていない人）には「次にやること」の下に記録の案内を出す
 *   （`RecordCtaCard`）。今することを先に置き、案内はその後
 *
 * @flow
 * 1. 「次にやること」のボタンでレッスン / 練習 / 試験へ進む。全級取得済みなら
 *    「レッスンの続き」の行でレッスン、「目次へ」でレッスンの目次、
 *    「おすすめの練習」のカードで和了形の点数計算の説明へ
 * 2. 級の見出しで級の詳細、進み具合の各段でその段の一覧へ
 * 3. ゲストは記録の案内から登録・ログインへ、ユーザー名を決めていない人は
 *    ユーザー名の設定へ進む
 * 4. お知らせの行で詳細、「すべて見る」で一覧へ
 * 5. ログイン中は「本日の問題」の「解く」/「もう一度見る」で出題画面へ
 */
export default function HomeScreen() {
  const t = useTranslations("nav");
  const tNotifications = useTranslations("notifications");
  const router = useRouter();
  const { status, user } = useAuth();
  const unread = useUnreadNotifications(
    status === "signedIn" ? user?.id : undefined,
  );
  const unreadCount = unread?.unreadCount ?? 0;
  const { input } = useAccountProgress();
  const { journey, nextChapter, showAgariScorePractice } = useMemo(
    () =>
      selectDashboardGuidance(input, {
        unavailableLessonSlugs: UNPORTED_LESSON_SLUGS,
      }),
    [input],
  );

  return (
    <Screen
      title={t("home")}
      contentStyle={styles.content}
      titleAction={
        <HeaderIconButton
          testID="home-mypage"
          onPress={() => router.push(MYPAGE_PATH)}
          label={
            unreadCount > 0
              ? tNotifications("mypageEntryUnread", { count: unreadCount })
              : t("mypage")
          }
          element={<MypageEntryIcon unreadCount={unreadCount} />}
        />
      }
    >
      <HomeNotifications />
      <NextStepCard journey={journey} />
      <DailyProblemSection />
      {nextChapter !== undefined && (
        <ContinueLearningSection
          completedSlugs={input.completedLessonSlugs}
          nextChapter={nextChapter}
        />
      )}
      {showAgariScorePractice && <AgariScorePracticeSection />}
      <RecordCtaCard placement="home" />
      <HomeAnnouncements />
    </Screen>
  );
}

/**
 * マイページの入口の絵柄。アバター画像があればそれ、無ければ人型のアイコン。
 * 未読の通知があれば右上に件数のバッジを重ねる（件数は `HomeNotifications` が
 * 読んでストアに載せる。ナビゲーターが画面の外で描くので props で受ける）
 */
function MypageEntryIcon({ unreadCount }: { readonly unreadCount: number }) {
  return (
    <View>
      <MypageEntryPicture />
      {unreadCount > 0 && (
        <View style={styles.badge} pointerEvents="none">
          <UnreadCountBadge count={unreadCount} size="sm" />
        </View>
      )}
    </View>
  );
}

function MypageEntryPicture() {
  const { account } = useAuth();
  const profile = account?.profile;
  if (profile?.avatarUrl !== undefined) {
    return (
      <UserAvatar
        avatarUrl={profile.avatarUrl}
        name={profile.username}
        size={ENTRY_SIZE}
      />
    );
  }
  return (
    <SymbolIcon
      name="person"
      size={20}
      color={colors.foreground}
      fallback={<UserIcon size={24} color={colors.surface700} />}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  // アバターの右上の角に半分はみ出させる（スマホアプリで見慣れたバッジの位置）
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
  },
});
