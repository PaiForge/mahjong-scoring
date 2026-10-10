import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";

import { FormMessage } from "../auth/form-message";
import { ConfirmationModal } from "../components/confirmation-modal";
import { TextLink } from "../components/text-link";
import { showToast } from "../components/toast";
import { colors, radius } from "../lib/theme";
import {
  deleteAvatar,
  uploadAvatar,
  type AvatarApiFailure,
} from "./mypage-api";
import { pickAvatarImage } from "./pick-avatar-image";
import { UserAvatar } from "./user-avatar";

const AVATAR_SIZE = 96;

/**
 * 失敗を辞書のキーに写す（`profileEdit.*`）。ネットワークは `auth.networkError`。
 * 理由を言い分けないものは、上げる・消すのそれぞれの汎用の文言
 */
const ERROR_KEYS = {
  invalidType: "avatarInvalidType",
  tooLarge: "avatarTooLarge",
  invalidImage: "avatarConversionFailed",
  rateLimited: "rateLimited",
  banned: "banned",
  // 退会の受付・ログアウト・ユーザー名の未設定は、ゲートが記録の案内へ切り替える
  unauthorized: undefined,
  deleted: undefined,
  userChanged: undefined,
  usernameRequired: undefined,
  authUnavailable: undefined,
  unknown: undefined,
} as const satisfies Record<
  Exclude<AvatarApiFailure, "network">,
  string | undefined
>;

/**
 * アバターの変更と削除（web の `AvatarUpload`）
 * アバター編集
 *
 * 選んだらすぐに上げる（web と同じ。保存ボタンは文字の欄のためのもの）。
 * 済んだことはトーストで知らせ、失敗の理由は操作の下に残す。
 * 画像は選ぶ画面で正方形に切り抜かせ、端末で縮めてから送る
 * （`pickAvatarImage`）。削除は確認を挟む。
 *
 * web と違うもの: 画像の上の削除バッジは置かず、「画像を選択」と並べた
 * 文字の操作にする（小さな丸の × は指で押しにくい）。
 */
export function AvatarEditor({
  userId,
  name,
  initialAvatarUrl,
}: {
  readonly userId: string;
  /** 画像が無いときに頭文字を出す名前 */
  readonly name: string;
  readonly initialAvatarUrl: string | undefined;
}) {
  const t = useTranslations("profileEdit");
  const tAuth = useTranslations("auth");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const failure = (
    failed: AvatarApiFailure,
    fallback: "avatarUploadFailed" | "avatarRemoveFailed",
  ): string =>
    failed === "network"
      ? tAuth("networkError")
      : t(ERROR_KEYS[failed] ?? fallback);

  const change = async () => {
    if (busy) return;
    setError(undefined);
    const picked = await pickAvatarImage();
    if (picked === "canceled") return;
    if (picked === "failed") {
      setError(t("avatarConversionFailed"));
      return;
    }
    setBusy(true);
    const result = await uploadAvatar(userId, picked.uri);
    setBusy(false);
    if ("error" in result) {
      setError(failure(result.error, "avatarUploadFailed"));
      return;
    }
    setAvatarUrl(result.avatarUrl);
    showToast(t("avatarUploaded"), "success");
  };

  const remove = async () => {
    setConfirmingRemove(false);
    if (busy) return;
    setError(undefined);
    setBusy(true);
    const result = await deleteAvatar(userId);
    setBusy(false);
    if ("error" in result) {
      setError(failure(result.error, "avatarRemoveFailed"));
      return;
    }
    setAvatarUrl(undefined);
    showToast(t("avatarRemoved"), "success");
  };

  return (
    <View style={styles.root}>
      <View testID="profile-edit-avatar">
        <UserAvatar avatarUrl={avatarUrl} name={name} size={AVATAR_SIZE} />
        {busy && (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.white} />
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <TextLink
          testID="profile-edit-avatar-change"
          onPress={() => void change()}
        >
          {t("avatarChange")}
        </TextLink>
        {avatarUrl !== undefined && (
          <TextLink
            testID="profile-edit-avatar-remove"
            onPress={() => setConfirmingRemove(true)}
          >
            {t("avatarRemove")}
          </TextLink>
        )}
      </View>
      {error !== undefined && <FormMessage tone="error">{error}</FormMessage>}
      <ConfirmationModal
        isOpen={confirmingRemove}
        title={t("avatarRemoveConfirmTitle")}
        message={t("avatarRemoveConfirmMessage")}
        confirmText={t("avatarRemoveConfirmOk")}
        cancelText={t("avatarRemoveConfirmCancel")}
        confirmVariant="danger"
        onConfirm={() => void remove()}
        onClose={() => setConfirmingRemove(false)}
        testID="profile-edit-avatar-remove-dialog"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    gap: 8,
  },
  busy: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  actions: {
    flexDirection: "row",
    gap: 24,
  },
});
