/**
 * アカウント登録
 *
 * @description Apple（iOS だけ）か、メールアドレスとパスワードで登録する。
 * Apple はその場で登録とログインが済み、ユーザー名の設定へ進む。メールの
 * 確認メールのリンクは web に着地する（どの端末で開いても確認が済むよう
 * `token_hash` で検証する）ので、確認が済んだらアプリに戻ってログインしてもらう。メールを開いた
 * ブラウザでも web にログインした状態になるが、同じアカウントなので
 * どちらでユーザー名を決めてもよい。
 * @flow 記録の案内（ホーム・マイページ）/ 設定の会員限定ゲート → 登録 → 確認メールの案内
 * （`/sign-up/verify-email`）→（メールのリンク）→ ログイン
 * （Apple: 記録の案内 → 登録 → Apple のシート → ユーザー名の設定）
 *
 * 利用規約への同意は、登録の手段（Apple・メール）より上に置いた一文で取る
 * （web の登録画面と同じ）。規約とプライバシーポリシーはマイページの「その他」と
 * 同じく web のページをブラウザで開く。
 */
import { useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  MIN_PASSWORD_LENGTH,
  validatePasswordPair,
} from "@mahjong-scoring/features/account/password";

import { AppleSignInSection } from "../../auth/apple-sign-in-section";
import { FormMessage } from "../../auth/form-message";
import { supabase } from "../../auth/supabase-client";
import { refreshAccount } from "../../auth/use-auth";
import { Button } from "../../components/button";
import { Screen } from "../../components/screen";
import { TextField } from "../../components/text-field";
import { TextLink } from "../../components/text-link";
import { SITE_URL } from "../../lib/app-site-url";
import { InlineTextLink } from "../../lessons/components/chapter-link";
import { colors } from "../../lib/theme";

/** 登録の失敗を辞書の文言に写すための分類 */
type SignUpFailure = "weak" | "rateLimited" | "networkError" | "failed";

function signUpFailure(
  code: string | undefined,
  status: number | undefined,
): SignUpFailure {
  if (code === "weak_password") return "weak";
  if (status === 429) return "rateLimited";
  if (status === undefined || status === 0) return "networkError";
  return "failed";
}

export default function SignUpScreen() {
  const t = useTranslations("signUp");
  const tAuth = useTranslations("auth");
  const tPassword = useTranslations("validation.password");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const failureMessage = (failure: SignUpFailure): string => {
    switch (failure) {
      case "weak":
        return tPassword("weak");
      case "rateLimited":
        return t("rateLimited");
      case "networkError":
        return tAuth("networkError");
      case "failed":
        return t("emailSignUpError");
    }
  };

  const submit = async () => {
    if (!supabase || submitting) return;
    const invalid = validatePasswordPair(password, confirmPassword);
    if (invalid) {
      setError(
        invalid.type === "mismatch"
          ? t("passwordMismatch")
          : tPassword(invalid.key, { minLength: MIN_PASSWORD_LENGTH }),
      );
      return;
    }
    setSubmitting(true);
    setError(undefined);
    const trimmedEmail = email.trim();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
    });
    setSubmitting(false);
    if (signUpError) {
      setError(
        failureMessage(signUpFailure(signUpError.code, signUpError.status)),
      );
      return;
    }
    // メールの確認を求めない設定ならその場でログインしている
    if (data.session) {
      await refreshAccount();
      router.replace("/mypage/setup-username");
      return;
    }
    // 確認待ちの画面は登録のフォームの上に積む。打ち間違いを直すときは
    // 入力した値の残るこの画面へ戻る（`verify-email.tsx`）
    router.push({
      pathname: "/sign-up/verify-email",
      params: { email: trimmedEmail },
    });
  };

  return (
    <Screen title={t("pageTitle")} back contentStyle={styles.content}>
      <Text style={styles.consent} testID="sign-up-consent">
        {t.rich("consent", {
          terms: (chunks) => (
            <InlineTextLink
              onPress={() => void Linking.openURL(`${SITE_URL}/terms`)}
            >
              {chunks}
            </InlineTextLink>
          ),
          privacy: (chunks) => (
            <InlineTextLink
              onPress={() => void Linking.openURL(`${SITE_URL}/privacy`)}
            >
              {chunks}
            </InlineTextLink>
          ),
        })}
      </Text>
      <AppleSignInSection mode="signUp" />
      <View style={styles.form}>
        <TextField
          label={t("emailLabel")}
          value={email}
          onChangeText={setEmail}
          placeholder={t("emailPlaceholder")}
          kind="email"
        />
        <TextField
          label={t("passwordLabel")}
          value={password}
          onChangeText={setPassword}
          placeholder={t("passwordPlaceholder")}
          kind="newPassword"
          secure
        />
        <TextField
          label={t("confirmPasswordLabel")}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t("confirmPasswordPlaceholder")}
          kind="newPassword"
          secure
          onSubmitEditing={() => void submit()}
        />
        {error !== undefined && <FormMessage tone="error">{error}</FormMessage>}
        <Button
          onPress={() => void submit()}
          disabled={submitting || !email || !password || !confirmPassword}
          fullWidth
          size="lg"
        >
          {submitting ? t("emailSignUpLoading") : t("emailSignUp")}
        </Button>
        <Text style={styles.assurance}>{t("freeAssurance")}</Text>
      </View>
      <View style={styles.signInRow}>
        <Text style={styles.lead}>{tAuth("alreadyHaveAccount")}</Text>
        <TextLink
          onPress={() => router.replace("/sign-in")}
          testID="sign-up-sign-in"
        >
          {tAuth("signInLinkText")}
        </TextLink>
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
  consent: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface700,
  },
  assurance: {
    fontSize: 13,
    textAlign: "center",
    color: colors.mutedForeground,
  },
  signInRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  lead: {
    fontSize: 15,
    color: colors.surface600,
  },
});
