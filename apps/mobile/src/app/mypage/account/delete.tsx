/**
 * 退会
 *
 * @description アカウントを削除する（App Store の審査ガイドライン 5.1.1(v):
 * アカウントを作れるアプリはアプリの中で削除できること）。web の退会と
 * 同じ受付をサーバーで行い、消える内容も同じ文言で示す。受け付けた後の
 * 工程はサーバーが最後まで進めるので（一時障害で残った分も再開する）、
 * 受け付けたらこの端末のログイン状態を捨ててゲストに戻り、設定で
 * 受け付けたことを知らせる。BAN 中・ユーザー名を決める前でも退会できる。
 * Apple でログインしたことがあり、サーバーが Apple の連携の取り消しに使う
 * トークンを持っていなければ、退会の前に Apple のシートで確認し直す。
 * @flow 設定のアカウント（またはユーザー名の設定）→ 退会 → 確認 → 設定へ戻る
 */
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import {
  deleteOwnAccount,
  type DeleteAccountFailure,
} from "../../../auth/account-api";
import { FormMessage } from "../../../auth/form-message";
import { Button } from "../../../components/button";
import { ConfirmationModal } from "../../../components/confirmation-modal";
import { Screen } from "../../../components/screen";
import { SectionTitle } from "../../../components/section-title";
import { panelFrame } from "../../../lib/panel-styles";
import { colors } from "../../../lib/theme";

/** 退会の失敗を辞書のキーに写す（`deleteAccount.*`） */
function deletionErrorKey(
  error: DeleteAccountFailure,
):
  | "rateLimited"
  | "networkError"
  | "appleRequired"
  | "appleMismatch"
  | "appleNotSupported"
  | "error" {
  switch (error) {
    case "rateLimited":
      return "rateLimited";
    case "network":
    case "appleUnavailable":
      return "networkError";
    case "appleCanceled":
    case "appleAuthorizationRequired":
      return "appleRequired";
    case "appleRejected":
      return "appleMismatch";
    case "appleNotSupported":
      return "appleNotSupported";
    default:
      return "error";
  }
}

export default function DeleteAccountScreen() {
  const t = useTranslations("deleteAccount");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const remove = async () => {
    setConfirming(false);
    setDeleting(true);
    setError(undefined);
    const result = await deleteOwnAccount();
    setDeleting(false);
    if ("error" in result) {
      setError(t(deletionErrorKey(result.error)));
      return;
    }
    // 受け付けた知らせ（完了か、残りをサーバーが続けているか）は設定の
    // アカウントの節が出す（deleteOwnAccount が知らせを立てる）
    router.dismissTo("/preferences");
  };

  return (
    <Screen title={t("pageTitle")} back contentStyle={styles.content}>
      <SectionTitle>{t("sectionTitle")}</SectionTitle>
      <Text style={styles.warning}>{t("warning")}</Text>
      <View style={[panelFrame, styles.consequences]}>
        {(["personalData", "scoresRemoved", "usernameLocked"] as const).map(
          (key) => (
            <Text key={key} style={styles.consequence}>
              {`・${t(`consequences.${key}`)}`}
            </Text>
          ),
        )}
      </View>
      {error !== undefined && <FormMessage tone="error">{error}</FormMessage>}
      <Button
        onPress={() => setConfirming(true)}
        variant="danger"
        disabled={deleting}
        fullWidth
        size="lg"
      >
        {deleting ? t("deleting") : t("confirmButton")}
      </Button>
      <ConfirmationModal
        isOpen={confirming}
        title={t("confirmTitle")}
        message={t("confirmMessage")}
        confirmText={t("confirmOk")}
        cancelText={t("confirmCancel")}
        confirmVariant="danger"
        onConfirm={() => void remove()}
        onClose={() => setConfirming(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
  },
  warning: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.destructiveStrong,
    fontWeight: "600",
  },
  consequences: {
    padding: 16,
    gap: 8,
  },
  consequence: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface700,
  },
});
