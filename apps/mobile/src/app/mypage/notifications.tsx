import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { useTranslations } from "use-intl";
import type { MobileNotification } from "@mahjong-scoring/features/notifications/mobile-api";

import { FormMessage } from "../../auth/form-message";
import { IAP_AVAILABLE } from "../../billing/iap-availability";
import { Button } from "../../components/button";
import { LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { colors } from "../../lib/theme";
import { useLoadMore } from "../../lib/use-load-more";
import { MypageGate, MypageLoadFailed } from "../../mypage/mypage-gate";
import { LoadingIndicator } from "../../components/load-state";
import { useMypageRead } from "../../mypage/use-mypage-read";
import { NotificationRow } from "../../notifications/notification-row";
import {
  fetchNotifications,
  markNotificationsRead,
} from "../../notifications/notifications-api";

/**
 * 通知
 *
 * @description
 * web の通知（`/mypage/notifications`）。ログイン中の本人に届いた通知を
 * 新しい順に並べる。いまの種別はすべて Pro プランの出来事（購入完了・期限切れ・
 * 運営からの付与・取り消し）で、App Store での購入・取り消しも web の Stripe と
 * 同じ通知になる。未読は太字 + 緑の点、文面は web と同じ辞書から引く。
 *
 * iOS だけの画面（Android は Pro を扱わず、通知の中身がすべて Pro の出来事の
 * ため。分岐は `IAP_AVAILABLE`）。マイページに行が出ないので Android から来る
 * ことは無いが、ディープリンクで開かれたらマイページへ戻す。ゲストとユーザー名を
 * 決めていない人には、マイページと同じく記録の案内を出す。
 *
 * web と違うもの:
 * - ページ送りの代わりに、末尾の「さらに読み込む」で次のページを下に足す
 *   （マイレコードの全履歴・お知らせと同じ）。画面に戻るたびに 1 ページ目から
 *   読み直す。読んでいる間に新しい通知が届くとページの境目がずれて同じ行が
 *   また来るので、id で重ねない
 * - 「すべて既読にする」に失敗したときは、web のトーストの代わりにボタンの
 *   下へ理由を出す（失敗の理由はトーストにしない。アプリの規約）
 * - 遷移先は web と同じ購入状況（アプリではプラン画面）。web にしか無い
 *   行き先（料金の `/plan`・特商法・Stripe）へは送らない（`notificationHref`）
 *
 * @flow
 * 1. マイページの「通知」の行から開く（未読があれば行に件数が出る）
 * 2. 行を押すと既読になり、プラン画面へ
 * 3. 「すべて既読にする」で未読をまとめて既読に
 */
export default function NotificationsScreen() {
  const t = useTranslations("notifications");
  if (!IAP_AVAILABLE) return <Redirect href="/mypage" />;
  return (
    <Screen title={t("pageTitle")} back contentStyle={styles.content}>
      <MypageGate>{(userId) => <Notifications userId={userId} />}</MypageGate>
    </Screen>
  );
}

/** 同じ id の行を後ろから来た分だけ落とす（ページの境目のずれ） */
function uniqueById(
  items: readonly MobileNotification[],
): MobileNotification[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function Notifications({ userId }: { readonly userId: string }) {
  const t = useTranslations("notifications");
  const { state, reload } = useMypageRead(
    useCallback(() => fetchNotifications(userId, 1), [userId]),
  );
  const firstPage = state.kind === "loaded" ? state.value : undefined;
  const { items, hasMore, loading, error, loadMore } = useLoadMore(
    firstPage,
    (page: number) => fetchNotifications(userId, page),
  );
  // この画面で押して既読にした行。既読化の通信は待たずに遷移するので、
  // 戻ってきたときに読み直しが先に着いても未読に戻して見せない
  const [readHere, setReadHere] = useState<ReadonlySet<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);
  const [markAllFailed, setMarkAllFailed] = useState(false);

  if (state.kind === "loading") return <LoadingIndicator />;
  if (state.kind === "failed")
    return <MypageLoadFailed message={t("loadFailed")} onRetry={reload} />;

  const rows = uniqueById(items);
  const isRead = (item: MobileNotification) =>
    item.readAt !== undefined || readHere.has(item.id);
  const readHereCount = rows.filter(
    (item) => item.readAt === undefined && readHere.has(item.id),
  ).length;
  const unreadCount = Math.max(0, state.value.unreadCount - readHereCount);

  const markRead = (id: string) => {
    setReadHere((prev) => new Set(prev).add(id));
    void markNotificationsRead(userId, { id });
  };

  const markAll = () => {
    setMarkingAll(true);
    setMarkAllFailed(false);
    void markNotificationsRead(userId, { all: true }).then((result) => {
      setMarkingAll(false);
      if ("error" in result) {
        setMarkAllFailed(true);
        return;
      }
      reload();
    });
  };

  return (
    <View style={styles.section}>
      {unreadCount > 0 && (
        <View style={styles.unreadBar}>
          <Text style={styles.unreadCount}>
            {t("unreadCount", { count: unreadCount })}
          </Text>
          <Button
            variant="secondary"
            size="sm"
            testID="notifications-mark-all-read"
            disabled={markingAll}
            onPress={markAll}
          >
            {t("markAllRead")}
          </Button>
        </View>
      )}
      {markAllFailed && (
        <FormMessage tone="error">{t("markAllReadFailed")}</FormMessage>
      )}
      {rows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t("empty")}</Text>
          <Text style={styles.emptyHint}>{t("emptyHint")}</Text>
        </View>
      ) : (
        <LinkRowList>
          {rows.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              read={isRead(notification)}
              onRead={() => markRead(notification.id)}
            />
          ))}
        </LinkRowList>
      )}
      {error !== undefined && <MypageLoadFailed message={t("loadFailed")} />}
      {hasMore && (
        <Button
          variant="secondary"
          fullWidth
          testID="notifications-more"
          disabled={loading}
          onPress={loadMore}
        >
          {t("loadMore")}
        </Button>
      )}
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
  unreadBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  unreadCount: {
    fontSize: 15,
    color: colors.surface600,
  },
  empty: {
    gap: 8,
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface500,
    textAlign: "center",
  },
});
