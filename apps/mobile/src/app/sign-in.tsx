/**
 * ログイン
 *
 * @description Apple（iOS だけ）か、メールアドレスとパスワードでログインする。
 * web で登録したアカウントもそのまま使える（同じ Supabase の認証）。ユーザー名をまだ
 * 決めていなければ、続けてユーザー名の設定へ進む。
 * パスワードの再設定は web の画面で行う（メールのリンクも web に着地するため）。
 * @flow 設定のアカウント → ログイン →（ユーザー名の設定）→ 設定へ戻る
 */
import { useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { AppleSignInSection } from "../auth/apple-sign-in-section";
import { FormMessage } from "../auth/form-message";
import { supabase } from "../auth/supabase-client";
import { refreshAccount } from "../auth/use-auth";
import { Button } from "../components/button";
import { Screen } from "../components/screen";
import { TextField } from "../components/text-field";
import { TextLink } from "../components/text-link";
import { SITE_URL } from "../lib/app-site-url";
import { colors } from "../lib/theme";

/** ログインの失敗を辞書のキーに写す（`auth.*`） */
function signInErrorKey(
  code: string | undefined,
  status: number | undefined,
): "emailNotConfirmed" | "rateLimited" | "networkError" | "emailSignInError" {
  if (code === "email_not_confirmed") return "emailNotConfirmed";
  if (status === 429 || code === "over_request_rate_limit")
    return "rateLimited";
  if (status === undefined || status === 0) return "networkError";
  return "emailSignInError";
}

export default function SignInScreen() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const submit = async () => {
    if (!supabase || submitting) return;
    setSubmitting(true);
    setError(undefined);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setSubmitting(false);
      setError(t(signInErrorKey(signInError.code, signInError.status)));
      return;
    }
    const account = await refreshAccount();
    setSubmitting(false);
    if (account && account.profile === null) {
      router.replace("/mypage/setup-username");
      return;
    }
    router.back();
  };

  return (
    <Screen title={t("signInPageTitle")} back contentStyle={styles.content}>
      <AppleSignInSection mode="signIn" />
      <View style={styles.form}>
        <TextField
          label={t("emailLabel")}
          value={email}
          onChangeText={setEmail}
          placeholder={t("emailPlaceholder")}
          kind="email"
          testID="sign-in-email"
        />
        <TextField
          label={t("passwordLabel")}
          value={password}
          onChangeText={setPassword}
          placeholder={t("passwordPlaceholder")}
          kind="password"
          secure
          onSubmitEditing={() => void submit()}
          testID="sign-in-password"
        />
        {error !== undefined && <FormMessage tone="error">{error}</FormMessage>}
        <Button
          onPress={() => void submit()}
          disabled={submitting || !email || !password}
          fullWidth
          size="lg"
          testID="sign-in-submit"
        >
          {submitting ? t("emailSignInLoading") : t("emailSignIn")}
        </Button>
      </View>
      <View style={styles.links}>
        <TextLink
          onPress={() => void Linking.openURL(`${SITE_URL}/forgot-password`)}
        >
          {t("forgotPasswordLink")}
        </TextLink>
        <View style={styles.signUpRow}>
          <Text style={styles.signUpLead}>{t("noAccountYet")}</Text>
          <TextLink onPress={() => router.replace("/sign-up")}>
            {t("signUpLinkText")}
          </TextLink>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 24,
  },
  form: {
    gap: 16,
  },
  links: {
    alignItems: "center",
    gap: 8,
  },
  signUpRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  signUpLead: {
    fontSize: 15,
    color: colors.surface600,
  },
});
