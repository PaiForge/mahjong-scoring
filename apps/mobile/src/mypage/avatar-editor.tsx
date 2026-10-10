import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";

import { FormMessage } from "../auth/form-message";
import { ConfirmationModal } from "../components/confirmation-modal";
import { TextLink } from "../components/text-link";
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

/** 知らせ（失敗の理由・済んだこと） */
interface Notice {
  readonly tone: "error" | "success";
  readonly text: string;
}

/**
 * アバターの変更と削除（web の `AvatarUpload`）
 * アバター編集
 *
 * 選んだらすぐに上げる（web と同じ。保存ボタンは文字の欄のためのもの）。
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
  const [notice, setNotice] = useState<Notice | undefined>(undefined);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const failure = (
    error: AvatarApiFailure,
    fallback: "avatarUploadFailed" | "avatarRemoveFailed",
  ): Notice => ({
    tone: "error",
    text:
      error === "network"
        ? tAuth("networkError")
        : t(ERROR_KEYS[error] ?? fallback),
  });

  const change = async () => {
    if (busy) return;
    setNotice(undefined);
    const picked = await pickAvatarImage();
    if (picked === "canceled") return;
    if (picked === "failed") {
      setNotice({ tone: "error", text: t("avatarConversionFailed") });
      return;
    }
    setBusy(true);
    const result = await uploadAvatar(userId, picked.uri);
    setBusy(false);
    if ("error" in result) {
      setNotice(failure(result.error, "avatarUploadFailed"));
      return;
    }
    setAvatarUrl(result.avatarUrl);
    setNotice({ tone: "success", text: t("avatarUploaded") });
  };

  const remove = async () => {
    setConfirmingRemove(false);
    if (busy) return;
    setNotice(undefined);
    setBusy(true);
    const result = await deleteAvatar(userId);
    setBusy(false);
    if ("error" in result) {
      setNotice(failure(result.error, "avatarRemoveFailed"));
      return;
    }
    setAvatarUrl(undefined);
    setNotice({ tone: "success", text: t("avatarRemoved") });
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
      {notice !== undefined && (
        <FormMessage tone={notice.tone}>{notice.text}</FormMessage>
      )}
      <ConfirmationModal
        isOpen={confirmingRemove}
        title={t("avatarRemoveConfirmTitle")}
        message={t("avatarRemoveConfirmMessage")}
        confirmText={t("avatarRemoveConfirmOk")}
        cancelText={t("avatarRemoveConfirmCancel")}
        confirmVariant="danger"
        onConfirm={() => void remove()}
        onClose={() => setConfirmingRemove(false)}
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
