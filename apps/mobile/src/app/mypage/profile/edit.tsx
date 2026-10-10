/**
 * プロフィール編集
 *
 * @description
 * web のプロフィール編集（`/mypage/profile/edit`）のうち、文字の欄
 * （表示名・自己紹介・X / Instagram / YouTube）を編集する。すべて任意。
 * 検証と書き込みは web と同じもの（アプリ向け API が web のフォームと
 * 同じ本体を呼ぶ）。
 *
 * web と違うもの:
 * - アバターは編集しない（マイページの見出しに出すだけ）
 * - 保存の知らせ（web のトースト）は出さない — マイページへ戻ると見出しが
 *   新しい名前に変わっている
 *
 * @flow
 * 1. マイページの「プロフィール編集」の行から開く
 * 2. 欄を書き換えて「保存する」 → マイページへ戻る
 * 3. 入力の誤りはボタンの上に理由を出し、画面に留まる
 */
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { MobileProfileResponse } from "@mahjong-scoring/features/profile/mobile-api";
import {
  PROFILE_LIMITS,
  type ProfileInput,
} from "@mahjong-scoring/features/profile/validation";

import { FormMessage } from "../../../auth/form-message";
import { refreshAccount } from "../../../auth/use-auth";
import { Button } from "../../../components/button";
import { Screen } from "../../../components/screen";
import { SectionTitle } from "../../../components/section-title";
import { TextField } from "../../../components/text-field";
import {
  fetchProfile,
  saveProfile,
  type SaveProfileFailure,
} from "../../../mypage/mypage-api";
import {
  MypageGate,
  MypageLoadFailed,
  MypageLoading,
} from "../../../mypage/mypage-gate";
import { useMypageRead } from "../../../mypage/use-mypage-read";

/**
 * 保存の失敗を辞書のキーに写す（`profileEdit.*`）。ネットワークは
 * `auth.networkError`。理由を言い分けないものは汎用の `error`
 */
const ERROR_KEYS = {
  displayNameTooLong: "displayNameTooLong",
  bioTooLong: "bioTooLong",
  xUsernameInvalid: "xUsernameInvalid",
  instagramUsernameInvalid: "instagramUsernameInvalid",
  youtubeHandleInvalid: "youtubeHandleInvalid",
  rateLimited: "rateLimited",
  banned: "banned",
  // 退会の受付・ログアウト・ユーザー名の未設定は、ゲートが記録の案内へ切り替える
  unauthorized: "error",
  deleted: "error",
  userChanged: "error",
  usernameRequired: "error",
  authUnavailable: "error",
  unknown: "error",
} as const satisfies Record<Exclude<SaveProfileFailure, "network">, string>;

export default function ProfileEditScreen() {
  const t = useTranslations("profileEdit");
  return (
    <Screen title={t("pageTitle")} back contentStyle={styles.content}>
      <MypageGate>{(userId) => <ProfileEdit userId={userId} />}</MypageGate>
    </Screen>
  );
}

function ProfileEdit({ userId }: { readonly userId: string }) {
  const t = useTranslations("mypage");
  const { state, reload } = useMypageRead(
    useCallback(() => fetchProfile(userId), [userId]),
  );
  if (state.kind === "loading") return <MypageLoading />;
  if (state.kind === "failed")
    return <MypageLoadFailed message={t("loadFailed")} onRetry={reload} />;
  return <ProfileForm userId={userId} initial={state.value} />;
}

/**
 * 編集フォーム（web の `ProfileForm` からアバターを除いたもの）
 *
 * 初期値は最初に読めた値だけを使う。画面に戻るたびの読み直しで、書きかけの
 * 欄を上書きしない。
 */
function ProfileForm({
  userId,
  initial,
}: {
  readonly userId: string;
  readonly initial: MobileProfileResponse;
}) {
  const t = useTranslations("profileEdit");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [input, setInput] = useState<ProfileInput>({
    displayName: initial.displayName,
    bio: initial.bio,
    xUsername: initial.xUsername,
    instagramUsername: initial.instagramUsername,
    youtubeHandle: initial.youtubeHandle,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const change = (key: keyof ProfileInput) => (value: string) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(undefined);
    const result = await saveProfile(userId, input);
    if ("error" in result) {
      setSubmitting(false);
      if (result.error === "usernameRequired") void refreshAccount();
      setError(
        result.error === "network"
          ? tAuth("networkError")
          : t(ERROR_KEYS[result.error]),
      );
      return;
    }
    router.back();
  };

  return (
    <>
      <View style={styles.section}>
        <SectionTitle>{t("basicSectionTitle")}</SectionTitle>
        <TextField
          testID="profile-edit-display-name"
          label={t("displayNameLabel")}
          value={input.displayName}
          onChangeText={change("displayName")}
          placeholder={t("displayNamePlaceholder")}
          maxLength={PROFILE_LIMITS.displayName}
        />
        <TextField
          testID="profile-edit-bio"
          label={t("bioLabel")}
          value={input.bio}
          onChangeText={change("bio")}
          placeholder={t("bioPlaceholder")}
          maxLength={PROFILE_LIMITS.bio}
          multiline
          hint={t("bioCounter", {
            count: input.bio.length,
            max: PROFILE_LIMITS.bio,
          })}
        />
      </View>
      <View style={styles.section}>
        <SectionTitle>{t("snsSectionTitle")}</SectionTitle>
        {/* 先頭の @ は検証が取り除くので、web と同じく 1 文字ぶん余分に入れられる */}
        <TextField
          testID="profile-edit-x"
          label={t("xLabel")}
          value={input.xUsername}
          onChangeText={change("xUsername")}
          placeholder={t("xPlaceholder")}
          maxLength={PROFILE_LIMITS.xUsername + 1}
          kind="handle"
        />
        <TextField
          testID="profile-edit-instagram"
          label={t("instagramLabel")}
          value={input.instagramUsername}
          onChangeText={change("instagramUsername")}
          placeholder={t("instagramPlaceholder")}
          maxLength={PROFILE_LIMITS.instagramUsername + 1}
          kind="handle"
        />
        <TextField
          testID="profile-edit-youtube"
          label={t("youtubeLabel")}
          value={input.youtubeHandle}
          onChangeText={change("youtubeHandle")}
          placeholder={t("youtubePlaceholder")}
          maxLength={PROFILE_LIMITS.youtubeHandle + 1}
          kind="handle"
        />
      </View>
      <View style={styles.submit}>
        {error !== undefined && <FormMessage tone="error">{error}</FormMessage>}
        <Button
          testID="profile-edit-submit"
          onPress={() => void submit()}
          disabled={submitting}
          fullWidth
          size="lg"
        >
          {submitting ? t("submitting") : t("submit")}
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  section: {
    gap: 16,
  },
  submit: {
    gap: 12,
  },
});
