import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { MobilePublicProfileResponse } from "@mahjong-scoring/features/public-profile/mobile-api";

import { Button } from "../components/button";
import { ConfirmationModal } from "../components/confirmation-modal";
import { showToast } from "../components/toast";
import { InlineTextLink } from "../lessons/components/chapter-link";
import { colors } from "../lib/theme";
import { blockUser, unblockUser } from "./moderation-api";
import { ReportSheet } from "./report-sheet";

/**
 * 公開プロフィールの末尾の通報・ブロック（web の公開プロフィールと同じ出し分け）
 * プロフィールのモデレーション操作
 *
 * - ゲスト — ログインが要る旨とログインへの導線
 * - 他の人 — 「通報する」（シート）と「ブロックする」（確認のダイアログ）
 * - 本人 — 何も置かない
 *
 * 済んだこと（通報した・ブロックした）は web と同じくトーストで知らせ、
 * 失敗は操作の下に 1 行で残す。ブロックできたら `onChanged` で読み直し、
 * 画面はブロック中の案内（{@link UnblockPanel}）に切り替わる。
 */
export function ProfileModeration({
  profile,
  viewerId,
  onChanged,
}: {
  readonly profile: MobilePublicProfileResponse;
  readonly viewerId: string | undefined;
  readonly onChanged: () => void;
}) {
  if (profile.relation === "self") return undefined;
  if (profile.relation === "guest" || viewerId === undefined) {
    return <GuestNote />;
  }
  return (
    <MemberActions
      username={profile.username}
      viewerId={viewerId}
      onChanged={onChanged}
    />
  );
}

/** ゲスト: 通報とブロックにはログインが要る */
function GuestNote() {
  const t = useTranslations("publicProfile");
  const router = useRouter();
  return (
    <View style={styles.footer}>
      <Text style={styles.note} testID="public-profile-guest-note">
        {t.rich("guestModerationNote", {
          signIn: (chunks) => (
            <InlineTextLink onPress={() => router.push("/sign-in")}>
              {chunks}
            </InlineTextLink>
          ),
        })}
      </Text>
    </View>
  );
}

/** ログイン中の他の人のプロフィール: 通報とブロック */
function MemberActions({
  username,
  viewerId,
  onChanged,
}: {
  readonly username: string;
  readonly viewerId: string;
  readonly onChanged: () => void;
}) {
  const t = useTranslations("publicProfile");
  const tReport = useTranslations("report");
  const [reporting, setReporting] = useState(false);
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [blockFailed, setBlockFailed] = useState(false);

  const block = () => {
    setConfirmingBlock(false);
    setBlocking(true);
    setBlockFailed(false);
    void blockUser(viewerId, username).then((result) => {
      setBlocking(false);
      if ("error" in result) {
        setBlockFailed(true);
        return;
      }
      showToast(t("blockedToast"), "success");
      onChanged();
    });
  };

  return (
    <View style={styles.footer}>
      <View style={styles.buttons}>
        <Button
          variant="neutral"
          testID="public-profile-report"
          onPress={() => {
            setBlockFailed(false);
            setReporting(true);
          }}
          style={styles.button}
        >
          {tReport("button")}
        </Button>
        <Button
          variant="neutral"
          testID="public-profile-block"
          disabled={blocking}
          onPress={() => setConfirmingBlock(true)}
          style={styles.button}
        >
          {t("block")}
        </Button>
      </View>
      {blockFailed && (
        <Text
          style={styles.error}
          testID="public-profile-moderation-message"
          accessibilityLiveRegion="polite"
        >
          {t("blockFailedToast")}
        </Text>
      )}
      <ReportSheet
        isOpen={reporting}
        onClose={() => setReporting(false)}
        onDone={() => {
          setReporting(false);
          showToast(tReport("doneToast"), "success");
        }}
        userId={viewerId}
        username={username}
      />
      <ConfirmationModal
        isOpen={confirmingBlock}
        title={t("blockConfirmTitle", { username })}
        message={t("blockConfirmMessage")}
        confirmText={t("blockConfirm")}
        cancelText={t("cancel")}
        confirmVariant="danger"
        testID="public-profile-block-confirm"
        onConfirm={block}
        onClose={() => setConfirmingBlock(false)}
      />
    </View>
  );
}

/**
 * ブロック中の人のプロフィール: 案内と解除（web と同じく中身は出さない）
 * ブロック中の案内
 */
export function UnblockPanel({
  username,
  viewerId,
  onChanged,
}: {
  readonly username: string;
  readonly viewerId: string | undefined;
  readonly onChanged: () => void;
}) {
  const t = useTranslations("publicProfile");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const unblock = () => {
    if (viewerId === undefined) return;
    setPending(true);
    setFailed(false);
    void unblockUser(viewerId, username).then((result) => {
      setPending(false);
      if ("error" in result) {
        setFailed(true);
        return;
      }
      showToast(t("unblockedToast"), "success");
      onChanged();
    });
  };

  return (
    <View style={styles.blocked}>
      <Text style={styles.notice} testID="public-profile-blocked">
        {t("blockedNotice", { username })}
      </Text>
      <Button
        variant="neutral"
        testID="public-profile-unblock"
        disabled={pending}
        onPress={unblock}
      >
        {t("unblock")}
      </Button>
      {failed && <Text style={styles.error}>{t("unblockFailedToast")}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.panel,
    paddingTop: 24,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    minWidth: 128,
  },
  note: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface500,
    textAlign: "center",
  },
  error: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.destructiveStrong,
    textAlign: "center",
  },
  blocked: {
    gap: 16,
    alignItems: "center",
  },
  notice: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface700,
    textAlign: "center",
  },
});
