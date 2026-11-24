import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  buildNotificationDetail,
  buildNotificationMessage,
} from "@mahjong-scoring/features/notifications/message";
import type { MobileNotification } from "@mahjong-scoring/features/notifications/mobile-api";
import { MYPAGE_PLAN_PATH } from "@mahjong-scoring/features/routes";

import { useAuth } from "../auth/use-auth";
import { IAP_AVAILABLE } from "../billing/iap-availability";
import { Button } from "../components/button";
import { CloseIcon, GiftIcon } from "../components/icons/icons";
import { usePullToRefresh } from "../components/screen-refresh";
import { borderWidth, colors, radius } from "../lib/theme";
import { useAppLocale } from "../lib/use-app-locale";
import { useFocusRead } from "../lib/use-focus-read";
import {
  fetchNotifications,
  markNotificationsRead,
} from "../notifications/notifications-api";
import {
  noteNotificationRead,
  publishUnreadNotifications,
  useUnreadNotifications,
} from "../notifications/unread-notifications";

/**
 * ホームの未読の通知（ヘッダーのアバターのバッジと、運営からの付与の告知カード）
 * ホーム未読通知
 *
 * 通知はマイページの奥にあり、未読はマイページを開くまで分からなかった。運営が
 * Pro を付与しても本人が気づかないので、ホームで 2 つの形で知らせる:
 *
 * - ヘッダーのアバターに未読の件数のバッジ（`MypageEntryBadge`）。アバターは
 *   ナビゲーターが画面の外で描くので、件数はモジュールのストア
 *   （`notifications/unread-notifications.ts`）から読む。この部品はそのストアに
 *   載せる役で、画面が前面に戻るたびに通知の 1 ページ目を読み直す
 * - 未読の付与の通知があれば、ホームの先頭にその通知のカード。付与は一度きりの
 *   大きな出来事で、バッジから通知を開いて読むまでの 2 手を待たせない。
 *   「プランを見る」か × で既読にし、カードは消える（通知の一覧で読んでも消える）。
 *   主役の「次にやること」は差し替えず、その上に読んだら消える知らせとして置く
 *
 * 通知は iOS だけ（`IAP_AVAILABLE`。種別がすべて Pro の出来事のため）で、ログイン中
 * だけ読む。読めなかったときは何も出さない（ホームの他の節と同じ扱い）。ユーザー名を
 * 決めていない人には API が 409 を返し、何も出ない。
 */
export function HomeNotifications() {
  const { status, user } = useAuth();
  const userId = status === "signedIn" ? user?.id : undefined;
  if (!IAP_AVAILABLE || userId === undefined) return null;
  return <AccountHomeNotifications key={userId} userId={userId} />;
}

function AccountHomeNotifications({ userId }: { readonly userId: string }) {
  const read = useCallback(async () => {
    const result = await fetchNotifications(userId, 1);
    if (!("error" in result)) publishUnreadNotifications(userId, result);
    return result;
  }, [userId]);
  const { reload } = useFocusRead(read);
  usePullToRefresh(reload);
  const summary = useUnreadNotifications(userId);
  if (summary?.unreadGrant === undefined) return null;
  return (
    <BenefitGrantCard userId={userId} notification={summary.unreadGrant} />
  );
}

function BenefitGrantCard({
  userId,
  notification,
}: {
  readonly userId: string;
  readonly notification: MobileNotification;
}) {
  const t = useTranslations("notifications");
  const router = useRouter();
  const locale = useAppLocale();
  const message = useMemo(
    () =>
      buildNotificationMessage(
        notification.type,
        notification.metadata,
        locale,
      ),
    [notification, locale],
  );
  // 例: notifications.messages.benefitGrantedUntil
  const text = t(`messages.${message.key}`, message.values);
  const detail = buildNotificationDetail(
    notification.type,
    notification.metadata,
  );

  // 既読化の通信は待たない（通知の一覧の行と同じ）。ストアには先に載せ、
  // 戻ったときの読み直しが追い越してもカードを出し直さない
  const markRead = () => {
    noteNotificationRead(userId, notification.id);
    void markNotificationsRead(userId, { id: notification.id });
  };

  return (
    <View style={styles.card} testID="home-benefit-grant">
      <View style={styles.header}>
        <View
          style={styles.icon}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <GiftIcon size={18} color={colors.successStrong} />
        </View>
        <Text style={styles.heading}>{t("homeGrant.heading")}</Text>
        <Pressable
          testID="home-benefit-grant-dismiss"
          accessibilityRole="button"
          accessibilityLabel={t("homeGrant.dismiss")}
          hitSlop={12}
          onPress={markRead}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <CloseIcon size={18} color={colors.surface500} />
        </Pressable>
      </View>
      <Text style={styles.message}>{text}</Text>
      {detail !== undefined && (
        <Text style={styles.body} numberOfLines={4}>
          {detail.body}
        </Text>
      )}
      <Button
        variant="secondary"
        fullWidth
        testID="home-benefit-grant-view-plan"
        onPress={() => {
          markRead();
          router.push(MYPAGE_PLAN_PATH);
        }}
      >
        {t("homeGrant.viewPlan")}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    borderWidth: borderWidth.panel,
    borderColor: colors.success,
    borderRadius: radius.panel,
    backgroundColor: colors.successSubtle,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  heading: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.successStrong,
  },
  close: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.5,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.foreground,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.surface700,
  },
});
