import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { formatJstDateTime } from "@mahjong-scoring/features/jst";
import { notificationHref } from "@mahjong-scoring/features/notifications/link";
import { buildNotificationMessage } from "@mahjong-scoring/features/notifications/message";
import type { MobileNotification } from "@mahjong-scoring/features/notifications/mobile-api";
import {
  NotificationType,
  isNotificationType,
} from "@mahjong-scoring/features/notifications/types";

import { CheckIcon, ClockIcon, CloseIcon } from "../components/icons/icons";
import { LinkRow } from "../components/link-row";
import { colors } from "../lib/theme";

/**
 * 通知 1 行（web の `NotificationItem`）
 * 通知行
 *
 * `LinkRowList` の中に並べる。文面が行の題名で、下に届いた日時。未読は
 * 題名を太字にし、行末に緑の点を置く（web と同じ）。文面は web と同じ
 * `buildNotificationMessage` で辞書から引く。
 *
 * 押すと遷移先（いまの種別はすべてプラン画面の `/mypage/plan`）へ進み、
 * 未読なら既読にする（`onRead`。既読化の通信は待たない — web と同じく遷移を
 * 止めない）。遷移先は web と共有の `notificationHref` が決め、両方にある
 * パスしか返さない（`link.ts` の TSDoc）。遷移先を持たない種別（退役した
 * 種別）は押せない行として出す。
 *
 * @param read - 既読か（サーバーの値に、この画面で押した分を重ねたもの）
 * @param onRead - 未読の行を押したときに呼ぶ
 */
export function NotificationRow({
  notification,
  read,
  onRead,
}: {
  readonly notification: MobileNotification;
  readonly read: boolean;
  readonly onRead: () => void;
}) {
  const t = useTranslations("notifications");
  const router = useRouter();
  const message = buildNotificationMessage(
    notification.type,
    notification.metadata,
  );
  const text = t(`messages.${message.key}`, message.values);
  const date = formatJstDateTime(new Date(notification.createdAt));
  const href = notificationHref(notification.type);
  const leading = <NotificationTypeIcon type={notification.type} />;
  const trailing = read ? undefined : <UnreadDot />;

  if (href === undefined) {
    return (
      <StaticRow
        title={text}
        description={date}
        leading={leading}
        trailing={trailing}
        plainTitle={read}
      />
    );
  }

  return (
    <LinkRow
      testID={`notification-${notification.id}`}
      title={text}
      description={date}
      leading={leading}
      trailing={trailing}
      plainTitle={read}
      accessibilityLabel={
        read ? `${text}、${date}` : `${t("unread")}、${text}、${date}`
      }
      onPress={() => {
        if (!read) onRead();
        router.push(href);
      }}
    />
  );
}

/** 未読の印（web の行末の緑の点）。読み上げは行の名前が持つ */
function UnreadDot() {
  return <View style={styles.dot} />;
}

/**
 * 押せない通知の行（遷移先を持たない種別）。`LinkRow` と同じ並びで、
 * 矢印と押したときの地の色だけを持たない
 */
function StaticRow({
  title,
  description,
  leading,
  trailing,
  plainTitle,
}: {
  readonly title: string;
  readonly description: string;
  readonly leading: ReactNode;
  readonly trailing: ReactNode;
  readonly plainTitle: boolean;
}) {
  return (
    <View style={styles.staticRow}>
      <View style={styles.side}>{leading}</View>
      <View style={styles.body}>
        <Text style={[styles.staticTitle, plainTitle && styles.plainTitle]}>
          {title}
        </Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {trailing !== undefined && <View style={styles.side}>{trailing}</View>}
    </View>
  );
}

/** 種別のアイコンの見た目 */
interface Appearance {
  readonly icon: (color: string) => ReactNode;
  readonly border: string;
  readonly background: string;
  readonly foreground: string;
}

const NEUTRAL: Appearance = {
  icon: (color) => <ClockIcon size={16} color={color} />,
  border: colors.surface300,
  background: colors.surface50,
  foreground: colors.surface600,
};

/**
 * 種別の見た目（web の `NotificationTypeIcon` と同じ対応）。良い知らせ
 * （購入・付与）は緑のチェック、期限切れは時計、取り消しは赤のバツ。登録に
 * 無い種別は期限切れと同じ中立の時計
 */
function appearanceOf(type: string): Appearance {
  if (!isNotificationType(type)) return NEUTRAL;
  switch (type) {
    case NotificationType.PurchaseCompleted:
    case NotificationType.BenefitGranted:
      return {
        icon: (color) => <CheckIcon size={16} color={color} />,
        border: colors.success,
        background: colors.successSubtle,
        foreground: colors.successStrong,
      };
    case NotificationType.PurchaseRevoked:
    case NotificationType.BenefitGrantRevoked:
      return {
        icon: (color) => <CloseIcon size={16} color={color} />,
        border: colors.destructive,
        background: colors.destructiveSubtle,
        foreground: colors.destructive,
      };
    case NotificationType.PlanExpired:
      return NEUTRAL;
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

/**
 * 行頭の種別のアイコン（web の `NotificationTypeIcon`）。装飾なので読み上げない
 * （文面が内容を持つ）。丸の 2px の枠は状態の印（面の枠ではない）
 */
function NotificationTypeIcon({ type }: { readonly type: string }) {
  const { icon, border, background, foreground } = appearanceOf(type);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.icon,
        { borderColor: border, backgroundColor: background },
      ]}
    >
      {icon(foreground)}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.action,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  // `LinkRow` の枠の中の行と同じ余白
  staticRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  side: {
    minHeight: 20,
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  staticTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
  },
  plainTitle: {
    fontWeight: "400",
  },
  description: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: colors.surface500,
  },
});
