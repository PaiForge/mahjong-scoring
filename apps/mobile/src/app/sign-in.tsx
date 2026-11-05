/**
 * ログイン
 *
 * @description Apple（iOS だけ）か、メールアドレスとパスワードでログインする。
 * web で登録したアカウントもそのまま使える（同じ Supabase の認証）。ユーザー名をまだ
 * 決めていなければ、続けてユーザー名の設定へ進む。
 * パスワードを忘れた人は再設定のリンクを送る画面へ（新しいパスワードはメールの
 * リンクから web で決める。`forgot-password.tsx`）。メールの確認が済んでいない
 * 人には、エラーの下に確認メールを再送する画面（`sign-up/verify-email.tsx`）への
 * 導線を出す。
 * 確認メールの画面（登録の後）から来たときは、登録に使ったメールアドレスを入れて開く。
 * @flow 記録の案内（ホーム・マイページ）/ 設定の会員限定ゲート /
 * 確認メールの案内（登録の後）→ ログイン →
 * （ユーザー名の設定）→ 元の画面へ戻る
 */
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { AppleSignInSection } from "../auth/apple-sign-in-section";
import { FormMessage } from "../auth/form-message";
import { supabase } from "../auth/supabase-client";
import { refreshAccount } from "../auth/use-auth";
import { useLeaveAuthFlow } from "../auth/use-leave-auth-flow";
import { Button } from "../components/button";
import { Screen } from "../components/screen";
import { showToast } from "../components/toast";
import { TextField } from "../components/text-field";
import { TextLink } from "../components/text-link";
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
  const leaveAuthFlow = useLeaveAuthFlow();
  // 確認メールの画面から開いたときは、登録に使ったメールアドレスが渡る
  const { email: initialEmail = "" } = useLocalSearchParams<{
    email?: string;
  }>();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  // 確認が済んでいなかったメールアドレス（再送の画面へ渡す）
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | undefined>(
    undefined,
  );

  // 誤りは前に送った入力についてのもの。打ち直したら消す（再送の導線も同じ）
  const changeInput =
    (setValue: (value: string) => void) => (value: string) => {
      setValue(value);
      setError(undefined);
      setUnconfirmedEmail(undefined);
    };

  const submit = async () => {
    if (!supabase || submitting) return;
    setSubmitting(true);
    setError(undefined);
    setUnconfirmedEmail(undefined);
    const trimmedEmail = email.trim();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    if (signInError) {
      setSubmitting(false);
      const key = signInErrorKey(signInError.code, signInError.status);
      setError(t(key));
      if (key === "emailNotConfirmed") setUnconfirmedEmail(trimmedEmail);
      return;
    }
    const account = await refreshAccount();
    setSubmitting(false);
    if (account && account.profile === null) {
      router.replace("/mypage/setup-username");
      return;
    }
    leaveAuthFlow();
    showToast(t("signInSuccess"), "success");
  };

  return (
    <Screen title={t("signInPageTitle")} back contentStyle={styles.content}>
      <AppleSignInSection mode="signIn" />
      <View style={styles.form}>
        <TextField
          label={t("emailLabel")}
          value={email}
          onChangeText={changeInput(setEmail)}
          placeholder={t("emailPlaceholder")}
          kind="email"
          testID="sign-in-email"
        />
        <TextField
          label={t("passwordLabel")}
          value={password}
          onChangeText={changeInput(setPassword)}
          placeholder={t("passwordPlaceholder")}
          kind="password"
          secure
          onSubmitEditing={() => void submit()}
          testID="sign-in-password"
        />
        {error !== undefined && <FormMessage tone="error">{error}</FormMessage>}
        {unconfirmedEmail !== undefined && (
          <TextLink
            onPress={() =>
              router.push({
                pathname: "/sign-up/verify-email",
                params: { email: unconfirmedEmail },
              })
            }
            testID="sign-in-resend-confirmation"
          >
            {t("emailNotConfirmedResend")}
          </TextLink>
        )}
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
          onPress={() => router.push("/forgot-password")}
          testID="sign-in-forgot-password"
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
      {/* web はログインに Google を持ち、アプリは持たない。web で Google だけを
          使ってきた人も、パスワードを足せば同じアカウントに入れる */}
      <Text style={styles.hint}>{t("googleAccountHint")}</Text>
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
  hint: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.surface500,
  },
});
