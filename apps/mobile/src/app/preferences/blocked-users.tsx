import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { MobileBlockedUser } from "@mahjong-scoring/features/moderation/mobile-api";
import { publicProfileHref } from "@mahjong-scoring/features/routes";

import { useViewer } from "../../auth/use-viewer";
import { Button } from "../../components/button";
import { Divider } from "../../components/divider";
import { LoadFailed, LoadingIndicator } from "../../components/load-state";
import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { panelFrame } from "../../lib/panel-styles";
import { colors } from "../../lib/theme";
import { useFocusRead } from "../../lib/use-focus-read";
import { UserAvatar } from "../../mypage/user-avatar";
import {
  fetchBlockedUsers,
  unblockUser,
} from "../../public-profile/moderation-api";

/**
 * ブロックしたユーザー
 *
 * @description
 * web の設定の「ブロックしたユーザー」の節。ブロックした人を新しい順に並べ、
 * その場で解除させる。行を押すとその人の公開プロフィール（ブロック中の案内）へ。
 * ブロックは公開プロフィールからしかできないので、ここに「追加」は無い。
 *
 * web と違うもの: 設定の中の節ではなく子ページ（`BLOCKED_USERS_PATH`）。解除の
 * 結果はトーストではなく一覧の下に 1 行で出す。解除は押した瞬間に行を消し、
 * 失敗したら戻す（web と同じ）。
 *
 * @flow 設定 → アカウント → ブロックしたユーザー → 解除
 */
export default function BlockedUsersScreen() {
  const t = useTranslations("settings");
  return (
    <Screen title={t("blockedUsersTitle")} back contentStyle={styles.content}>
      <SectionTitle>{t("blockedUsersTitle")}</SectionTitle>
      <Text style={styles.description}>{t("blockedUsersDescription")}</Text>
      <BlockedUsers />
    </Screen>
  );
}

/** 解除の結果（一覧の下に 1 行で出す） */
type UnblockMessage =
  | { readonly kind: "done"; readonly username: string }
  | { readonly kind: "failed" };

function BlockedUsers() {
  const t = useTranslations("settings");
  const viewer = useViewer();
  const viewerId = viewer.kind === "ready" ? viewer.viewerId : undefined;
  const read = useCallback(
    () =>
      viewerId === undefined
        ? Promise.resolve({ items: [] })
        : fetchBlockedUsers(viewerId),
    [viewerId],
  );
  const { state, reload } = useFocusRead(
    viewer.kind === "ready" ? read : undefined,
  );
  // 解除した人（応答を待たずに一覧から消す。失敗したら戻す）
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
  const [message, setMessage] = useState<UnblockMessage>();

  if (state.kind === "loading") return <LoadingIndicator />;
  if (state.kind === "failed") {
    return (
      <LoadFailed
        message={t("blockedUsersLoadFailed")}
        retry={{ label: t("account.retry"), onPress: reload }}
      />
    );
  }

  const unblock = (username: string) => {
    if (viewerId === undefined) return;
    setRemoved((prev) => new Set(prev).add(username));
    setMessage(undefined);
    void unblockUser(viewerId, username).then((result) => {
      if ("error" in result) {
        setRemoved((prev) => {
          const next = new Set(prev);
          next.delete(username);
          return next;
        });
        setMessage({ kind: "failed" });
        return;
      }
      setMessage({ kind: "done", username });
    });
  };

  const users = state.value.items.filter((row) => !removed.has(row.username));
  return (
    <>
      {users.length === 0 ? (
        <Text style={styles.empty} testID="blocked-users-empty">
          {t("blockedUsersEmpty")}
        </Text>
      ) : (
        <View style={panelFrame}>
          {users.map((row, i) => (
            <View key={row.username}>
              {i > 0 && <Divider tone="row" />}
              <BlockedUserRow user={row} onUnblock={unblock} />
            </View>
          ))}
        </View>
      )}
      {message !== undefined && (
        <Text
          style={message.kind === "done" ? styles.done : styles.failed}
          testID="blocked-users-message"
          accessibilityLiveRegion="polite"
        >
          {message.kind === "done"
            ? t("unblockedToast", { username: message.username })
            : t("unblockFailedToast")}
        </Text>
      )}
    </>
  );
}

/** 1 人の行（押すとプロフィール、右に解除） */
function BlockedUserRow({
  user,
  onUnblock,
}: {
  readonly user: MobileBlockedUser;
  readonly onUnblock: (username: string) => void;
}) {
  const t = useTranslations("settings");
  const router = useRouter();
  const name = user.displayName ?? user.username;
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push(publicProfileHref(user.username))}
        style={({ pressed }) => [styles.person, pressed && styles.pressed]}
      >
        <UserAvatar avatarUrl={user.avatarUrl} name={name} size={36} />
        <View style={styles.names}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.username} numberOfLines={1}>
            @{user.username}
          </Text>
        </View>
      </Pressable>
      <Button
        variant="neutral"
        size="sm"
        testID={`blocked-users-unblock-${user.username}`}
        onPress={() => onUnblock(user.username)}
      >
        {t("unblock")}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface500,
  },
  empty: {
    fontSize: 15,
    color: colors.surface500,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  person: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.6,
  },
  names: {
    flexShrink: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
  },
  username: {
    fontSize: 13,
    color: colors.surface500,
  },
  done: {
    fontSize: 14,
    color: colors.surface600,
  },
  failed: {
    fontSize: 14,
    color: colors.destructiveStrong,
  },
});
