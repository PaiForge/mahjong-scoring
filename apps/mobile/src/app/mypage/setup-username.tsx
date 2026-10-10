/**
 * ユーザー名の設定（本登録）
 *
 * @description 登録して最初にログインした後、ランキングなどに出るユーザー名を
 * 決める（web の `/mypage/setup-username` と同じ段階・同じ検証）。この段階
 * からもログアウトと退会に進める — ユーザー名を決めないまま
 * アカウントを消したい人を、ここで行き止まりにしない。名前を考えるのが
 * 手間な人には、web と同じくランダムなユーザー名の自動生成を添える。
 * @flow ログイン → ユーザー名の設定 → 元の画面へ戻り、登録の完了をトーストで知らせる
 */
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { getRandomBytes } from "expo-crypto";
import { useTranslations } from "use-intl";
import type { MobileUsernameErrorCode } from "@mahjong-scoring/features/account/mobile-api";
import {
  generateUsername,
  USERNAME_MAX_LENGTH,
} from "@mahjong-scoring/features/account/username";

import type { ApiFailure } from "../../auth/account-api";
import { registerUsername } from "../../auth/account-api";
import { FormMessage } from "../../auth/form-message";
import { refreshAccount, signOut } from "../../auth/use-auth";
import { useLeaveAuthFlow } from "../../auth/use-leave-auth-flow";
import { Button } from "../../components/button";
import { Screen } from "../../components/screen";
import { TextField } from "../../components/text-field";
import { TextLink } from "../../components/text-link";
import { showToast } from "../../components/toast";
import { colors } from "../../lib/theme";

/** 登録の失敗を辞書のキーに写す（`setupUsername.validation.*`） */
const ERROR_KEYS = {
  too_short: "tooShort",
  username_required: "tooShort",
  too_long: "tooLong",
  invalid_format: "invalidFormat",
  reserved: "reserved",
  prohibited: "prohibited",
  username_taken: "taken",
  username_already_set: "alreadySet",
  display_name_too_long: "displayNameTooLong",
  display_name_prohibited: "displayNameProhibited",
  rateLimited: "rateLimited",
  banned: "banned",
  unauthorized: "unauthorized",
  deleted: "unauthorized",
  // 送る前にログインが変わった（ユーザーを指定して送る記録の同期だけが返す）
  userChanged: "unauthorized",
  authUnavailable: "error",
  unknown: "error",
} as const satisfies Record<
  Exclude<MobileUsernameErrorCode | ApiFailure, "network">,
  string
>;

export default function SetupUsernameScreen() {
  const t = useTranslations("setupUsername");
  const tAuth = useTranslations("auth");
  const tNav = useTranslations("nav");
  const tAccount = useTranslations("mypageAccount");
  const router = useRouter();
  const leaveAuthFlow = useLeaveAuthFlow();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const changeUsername = (value: string) => {
    setUsername(value);
    setError(undefined);
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(undefined);
    const result = await registerUsername({
      username: username.trim(),
      displayName: displayName.trim() || undefined,
    });
    if ("error" in result) {
      setSubmitting(false);
      setError(
        result.error === "network"
          ? tAuth("networkError")
          : t(`validation.${ERROR_KEYS[result.error]}`),
      );
      return;
    }
    await refreshAccount();
    setSubmitting(false);
    leaveAuthFlow();
    showToast(t("registered"), "success");
  };

  return (
    <Screen title={t("title")} back contentStyle={styles.content}>
      <Text style={styles.lead}>{t("lead")}</Text>
      <View style={styles.form}>
        <TextField
          label={t("usernameLabel")}
          labelAction={
            <TextLink
              onPress={() => changeUsername(generateUsername(getRandomBytes))}
              testID="generate-username"
            >
              {t("generateUsername")}
            </TextLink>
          }
          value={username}
          onChangeText={changeUsername}
          placeholder={t("usernamePlaceholder")}
          maxLength={USERNAME_MAX_LENGTH}
          kind="username"
          hint={[
            t("usernameHintChars"),
            t("usernameHintEdges"),
            t("cannotChange"),
          ].join("\n")}
        />
        <TextField
          label={t("displayNameLabel")}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t("displayNamePlaceholder")}
          hint={[t("displayNameCanChange"), t("displayNameMaxLength")].join(
            "\n",
          )}
          onSubmitEditing={() => void submit()}
        />
        {error !== undefined && <FormMessage tone="error">{error}</FormMessage>}
        <Button
          onPress={() => void submit()}
          disabled={submitting || !username.trim()}
          fullWidth
          size="lg"
        >
          {submitting ? t("submitting") : t("submit")}
        </Button>
      </View>
      <View style={styles.links}>
        <TextLink
          onPress={() => {
            void signOut().then(() => {
              leaveAuthFlow();
              showToast(tNav("signOutSuccess"), "success");
            });
          }}
        >
          {tNav("signOut")}
        </TextLink>
        <TextLink onPress={() => router.push("/mypage/account/delete")}>
          {tAccount("deleteAccountLink")}
        </TextLink>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 24,
  },
  lead: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface700,
  },
  form: {
    gap: 16,
  },
  links: {
    alignItems: "center",
    gap: 4,
  },
});
