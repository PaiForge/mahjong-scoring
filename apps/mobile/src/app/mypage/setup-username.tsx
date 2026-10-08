/**
 * ユーザー名の設定（本登録）
 *
 * @description 登録して最初にログインした後、ランキングなどに出るユーザー名を
 * 決める（web の `/mypage/setup-username` と同じ段階・同じ検証）。この段階
 * からもログアウトと退会に進める — ユーザー名を決めないまま
 * アカウントを消したい人を、ここで行き止まりにしない。
 * @flow ログイン → ユーザー名の設定 → 設定へ戻る
 */
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { MobileUsernameErrorCode } from "@mahjong-scoring/features/account/mobile-api";

import type { ApiFailure } from "../../auth/account-api";
import { registerUsername } from "../../auth/account-api";
import { FormMessage } from "../../auth/form-message";
import { refreshAccount, signOut } from "../../auth/use-auth";
import { Button } from "../../components/button";
import { Screen } from "../../components/screen";
import { TextField } from "../../components/text-field";
import { TextLink } from "../../components/text-link";
import { colors } from "../../lib/theme";

/** 登録の失敗を辞書のキーに写す（`setupUsername.validation.*`） */
const ERROR_KEYS = {
  too_short: "tooShort",
  username_required: "tooShort",
  too_long: "tooLong",
  invalid_format: "invalidFormat",
  reserved: "reserved",
  username_taken: "taken",
  username_already_set: "alreadySet",
  display_name_too_long: "displayNameTooLong",
  rateLimited: "rateLimited",
  banned: "banned",
  unauthorized: "unauthorized",
  deleted: "unauthorized",
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
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

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
    router.back();
  };

  return (
    <Screen title={t("title")} back contentStyle={styles.content}>
      <Text style={styles.lead}>{t("lead")}</Text>
      <View style={styles.form}>
        <TextField
          label={t("usernameLabel")}
          value={username}
          onChangeText={setUsername}
          placeholder={t("usernamePlaceholder")}
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
            void signOut().then(() => router.back());
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
