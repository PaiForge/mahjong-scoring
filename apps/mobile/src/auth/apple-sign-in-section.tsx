import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { colors, radius } from "../lib/theme";
import { signInWithApple, useAppleSignInAvailable } from "./apple-sign-in";
import { FormMessage } from "./form-message";
import { refreshAccount } from "./use-auth";
import { useLeaveAuthFlow } from "./use-leave-auth-flow";

/**
 * Apple のログインボタンと、メールのフォームとの区切り（iOS だけ）
 * Appleログイン欄
 *
 * ボタンは Apple の部品（`AppleAuthenticationButton`）をそのまま使う。
 * 文言・色・ロゴは Apple の決まり（Human Interface Guidelines）で、独自の
 * ボタンに描き直さない。Apple のログインを出せない端末では何も出さない。
 *
 * ログインできたら、ユーザー名をまだ決めていなければユーザー名の設定へ、
 * 決めていれば元の画面へ戻る（メールのログインと同じ）。
 *
 * @param mode - `signIn` はログインの画面、`signUp` は登録の画面（ボタンの文言だけが変わる）
 */
export function AppleSignInSection({
  mode,
}: {
  readonly mode: "signIn" | "signUp";
}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const leaveAuthFlow = useLeaveAuthFlow();
  const available = useAppleSignInAvailable();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  if (!available) return null;

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(undefined);
    const result = await signInWithApple();
    if (result !== "signedIn") {
      setSubmitting(false);
      if (result === "networkError") setError(t("networkError"));
      if (result === "failed") setError(t("authError"));
      return;
    }
    const account = await refreshAccount();
    setSubmitting(false);
    if (account && account.profile === null) {
      router.replace("/mypage/setup-username");
      return;
    }
    leaveAuthFlow();
  };

  return (
    <View style={styles.section}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={
          mode === "signIn"
            ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            : AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
        }
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={radius.lg}
        style={styles.button}
        onPress={() => void submit()}
      />
      {error !== undefined && <FormMessage tone="error">{error}</FormMessage>}
      <View style={styles.separator}>
        <View style={styles.rule} />
        <Text style={styles.separatorText}>{t("or")}</Text>
        <View style={styles.rule} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  button: {
    height: 52,
    alignSelf: "stretch",
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.panel,
  },
  separatorText: {
    fontSize: 14,
    color: colors.surface600,
  },
});
