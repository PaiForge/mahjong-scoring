import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { isKnownAuthProvider } from "@mahjong-scoring/features/account/auth-provider";

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
import { showToast } from "../components/toast";
import { panelFrame } from "../lib/panel-styles";
import { colors } from "../lib/theme";

/**
 * 退会を受け付けた知らせ。工程が残っている（pending）ときは完了と言わない
 *
 * 退会の後はゲストに戻ってマイページへ戻るので、マイページの先頭に置く。
 * 知らせが無ければ何も出さない。
 */
export function DeletionNoticePanel() {
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

/**
 * アカウントの情報とログアウト・退会（ログイン中）
 * アカウント設定
 *
 * ユーザー名・メールアドレス・ログイン方法（web のアカウントのページと同じ）と、
 * ログアウト・退会を出す。ユーザー名を
 * 決めていなければ、その設定へ進む行を先頭に置く。BAN 中もログアウトと
 * 退会の行は出す（本人による退会は BAN の対象にしない）。ログアウトしたら
 * マイページへ戻る（ゲストに見せるアカウントの中身は無い）。
 */
export function SignedInAccount() {
  const t = useTranslations("settings.account");
  const tAccount = useTranslations("mypageAccount");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const { user, account, accountError } = useAuth();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  // 知らない値はそのまま出す（無いキーを引くと use-intl がエラーを出す）
  const providerLabel = (provider: string | undefined) =>
    isKnownAuthProvider(provider)
      ? tAccount(`login.providers.${provider}`)
      : (provider ?? tAccount("login.unknown"));

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
      <View style={styles.section}>
        <SectionTitle>{tAccount("login.title")}</SectionTitle>
        <View style={[panelFrame, styles.info]}>
          {account?.profile && (
            <>
              <InfoRow label={t("username")} value={account.profile.username} />
              <Divider />
            </>
          )}
          <InfoRow label={t("email")} value={user?.email ?? "—"} />
          <Divider />
          <InfoRow
            label={tAccount("login.provider")}
            value={providerLabel(user?.provider)}
          />
        </View>
      </View>
      <LinkRowList>
        <LinkRow
          testID="account-sign-out"
          title={t("signOut")}
          onPress={() => setConfirmingSignOut(true)}
        />
        <LinkRow
          testID="account-delete"
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
        testID="account-sign-out"
        onConfirm={() => {
          setConfirmingSignOut(false);
          void signOut().then(() => {
            showToast(tNav("signOutSuccess"), "success");
            router.dismissTo("/mypage");
          });
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
  section: {
    gap: 16,
  },
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
