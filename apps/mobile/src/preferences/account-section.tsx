import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { refreshAccount, signOut, useAuth } from "../auth/use-auth";
import {
  dismissDeletionNotice,
  useDeletionNotice,
} from "../auth/use-deletion-notice";
import { ConfirmationModal } from "../components/confirmation-modal";
import { Divider } from "../components/divider";
import { LinkRow, LinkRowList } from "../components/link-row";
import { SectionTitle } from "../components/section-title";
import { TextLink } from "../components/text-link";
import { panelFrame } from "../lib/panel-styles";
import { BLOCKED_USERS_PATH } from "../public-profile/blocked-users-path";
import { colors } from "../lib/theme";

/**
 * 設定のアカウントの節
 * アカウント設定
 *
 * ゲストにはログイン・登録の入口を、ログイン中はユーザー名・メール
 * アドレスと、ブロックしたユーザー・ログアウト・退会を出す。ユーザー名を決めていなければ、
 * その設定へ進む行を先頭に置く。
 *
 * ログインを出せないビルド（接続先が無い）と、保存したログイン状態を
 * 読んでいる間は節ごと出さない。
 *
 * BAN 中もログアウトと退会の行は出す（本人による退会は BAN の対象にしない）。
 */
export function AccountSection({
  style,
}: {
  /** 節の外枠（他の節と間隔をそろえる） */
  readonly style?: StyleProp<ViewStyle>;
}) {
  const t = useTranslations("settings.account");
  const { status } = useAuth();
  if (status === "unavailable" || status === "loading") return null;
  return (
    <View style={style}>
      <SectionTitle>{t("sectionTitle")}</SectionTitle>
      <DeletionNoticePanel />
      {status === "signedOut" ? <GuestAccount /> : <SignedInAccount />}
    </View>
  );
}

/**
 * 退会を受け付けた知らせ。工程が残っている（pending）ときは完了と言わない
 */
function DeletionNoticePanel() {
  const t = useTranslations("deleteAccount");
  const tAccount = useTranslations("settings.account");
  const notice = useDeletionNotice();
  if (notice === undefined) return null;
  return (
    <View style={[panelFrame, styles.notice]} accessibilityLiveRegion="polite">
      <Text style={styles.noticeText}>
        {notice === "completed" ? t("successToast") : t("acceptedToast")}
      </Text>
      <TextLink onPress={dismissDeletionNotice}>
        {tAccount("dismissNotice")}
      </TextLink>
    </View>
  );
}

/** ゲスト: ログイン・登録の入口 */
function GuestAccount() {
  const t = useTranslations("settings.account");
  const router = useRouter();
  return (
    <>
      <Text style={styles.lead}>{t("lead")}</Text>
      <LinkRowList>
        <LinkRow title={t("signIn")} onPress={() => router.push("/sign-in")} />
        <LinkRow title={t("signUp")} onPress={() => router.push("/sign-up")} />
      </LinkRowList>
    </>
  );
}

/** ログイン中: アカウントの情報とログアウト・退会 */
function SignedInAccount() {
  const t = useTranslations("settings.account");
  const tSettings = useTranslations("settings");
  const router = useRouter();
  const { user, account, accountError } = useAuth();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  return (
    <>
      {accountError === "banned" && (
        <Text style={styles.failedText}>{t("banned")}</Text>
      )}
      {accountError !== undefined && accountError !== "banned" && (
        <View style={styles.failed}>
          <Text style={styles.failedText}>{t("loadFailed")}</Text>
          <TextLink onPress={() => void refreshAccount()}>
            {t("retry")}
          </TextLink>
        </View>
      )}
      {account?.profile === null && (
        <LinkRowList>
          <LinkRow
            title={t("usernameMissing")}
            description={t("usernameMissingDescription")}
            onPress={() => router.push("/mypage/setup-username")}
          />
        </LinkRowList>
      )}
      <View style={[panelFrame, styles.info]}>
        {account?.profile && (
          <>
            <InfoRow label={t("username")} value={account.profile.username} />
            <Divider />
          </>
        )}
        <InfoRow label={t("email")} value={user?.email ?? "—"} />
      </View>
      <LinkRowList>
        <LinkRow
          title={tSettings("blockedUsersTitle")}
          testID="preferences-blocked-users"
          onPress={() => router.push(BLOCKED_USERS_PATH)}
        />
        <LinkRow
          title={t("signOut")}
          onPress={() => setConfirmingSignOut(true)}
        />
        <LinkRow
          title={t("deleteAccount")}
          onPress={() => router.push("/mypage/account/delete")}
        />
      </LinkRowList>
      <ConfirmationModal
        isOpen={confirmingSignOut}
        title={t("signOutConfirmTitle")}
        message={t("signOutConfirmMessage")}
        confirmText={t("signOut")}
        cancelText={t("signOutCancel")}
        onConfirm={() => {
          setConfirmingSignOut(false);
          void signOut();
        }}
        onClose={() => setConfirmingSignOut(false)}
      />
    </>
  );
}

function InfoRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    padding: 16,
    gap: 4,
    alignItems: "flex-start",
  },
  noticeText: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface800,
  },
  lead: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface700,
  },
  failed: {
    alignItems: "flex-start",
    gap: 4,
  },
  failedText: {
    fontSize: 15,
    color: colors.destructiveStrong,
  },
  info: {
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 15,
    color: colors.surface600,
  },
  infoValue: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface900,
  },
});
