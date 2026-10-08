/**
 * 退会
 *
 * @description アカウントを削除する（App Store の審査ガイドライン 5.1.1(v):
 * アカウントを作れるアプリはアプリの中で削除できること）。web の退会と
 * 同じ処理をサーバーで行い、消える内容も同じ文言で示す。削除は途中で
 * 失敗しても、もう一度押せば最初からやり直せる。成功したらこの端末の
 * ログイン状態も捨て、ゲストに戻る。
 * @flow 設定のアカウント（またはユーザー名の設定）→ 退会 → 確認 → 設定へ戻る
 */
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { deleteOwnAccount } from "../../../auth/account-api";
import { FormMessage } from "../../../auth/form-message";
import { Button } from "../../../components/button";
import { ConfirmationModal } from "../../../components/confirmation-modal";
import { Screen } from "../../../components/screen";
import { SectionTitle } from "../../../components/section-title";
import { panelFrame } from "../../../lib/panel-styles";
import { colors } from "../../../lib/theme";

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
      setError(
        result.error === "rateLimited"
          ? t("rateLimited")
          : result.error === "banned"
            ? t("banned")
            : result.error === "network"
              ? t("networkError")
              : t("error"),
      );
      return;
    }
    Alert.alert(t("successToast"));
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
