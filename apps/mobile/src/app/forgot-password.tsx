/**
 * パスワードの再設定（リンクの送信）
 *
 * @description 登録したメールアドレスに、パスワードを再設定するリンクを送る。
 * リンクは web の `/auth/callback`（`token_hash` で検証）を経て web の
 * `/reset-password` に着地し、新しいパスワードはブラウザで決める。決めたら
 * アプリに戻ってログインしてもらう（登録の確認メールと同じ）。
 *
 * 送信は登録・確認メールの再送と同じく supabase-js から直接行い、web の
 * アプリ向け API を通さない。公開キーで誰でも同じ要求を Supabase へ直接
 * 送れるので、web 側で IP の回数制限を掛けても防げるものが増えない。
 * 送信の回数制限と、登録の無いアドレスでも成功を返す（アカウントの有無を
 * 漏らさない）のは Supabase 側が持つ。
 *
 * アプリの中で再設定まで終える形（Universal Links でリンクを受ける）は
 * 採っていない。検証が本番のドメインと TestFlight でしかできず、規模に
 * 見合わないため。
 *
 * @flow ログイン → パスワードを忘れた方 → 送信 →（メールのリンク・ブラウザで再設定）→ ログイン
 */
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { FormMessage } from "../auth/form-message";
import { supabase } from "../auth/supabase-client";
import { Button } from "../components/button";
import { Screen } from "../components/screen";
import { TextField } from "../components/text-field";
import { SITE_URL } from "../lib/app-site-url";
import { colors } from "../lib/theme";

export default function ForgotPasswordScreen() {
  const t = useTranslations("forgotPassword");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!supabase || submitting) return;
    setSubmitting(true);
    setError(undefined);
    const { error: sendError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      // web の送信と同じ戻り先。メールの文面は token_hash で web の
      // /auth/callback を指すので、実際のリンクはこの値に依らない
      { redirectTo: `${SITE_URL}/auth/callback?type=recovery` },
    );
    setSubmitting(false);
    if (sendError) {
      setError(
        sendError.status === 429
          ? t("rateLimited")
          : sendError.status === undefined || sendError.status === 0
            ? tAuth("networkError")
            : t("error"),
      );
      return;
    }
    setSent(true);
  };

  return (
    <Screen title={t("pageTitle")} back contentStyle={styles.content}>
      {sent ? (
        <>
          <View style={styles.sent} testID="forgot-password-sent">
            <Text style={styles.body}>{t("sentDescription")}</Text>
            <Text style={styles.body}>{t("checkInbox")}</Text>
            <Text style={styles.body}>{t("returnToApp")}</Text>
          </View>
          {/* 下のログイン画面まで閉じて戻る。置き換えるとログイン画面が 2 枚
              重なり、ログインした後の戻るでもう 1 枚が出る。直接開いたときは
              ログイン画面に置き換わる */}
          <Button
            onPress={() => router.dismissTo("/sign-in")}
            testID="forgot-password-back-to-sign-in"
            fullWidth
            size="lg"
          >
            {t("backToSignIn")}
          </Button>
        </>
      ) : (
        <View style={styles.form}>
          <Text style={styles.body}>{t("description")}</Text>
          <TextField
            label={t("emailLabel")}
            value={email}
            onChangeText={setEmail}
            placeholder={t("emailPlaceholder")}
            kind="email"
            onSubmitEditing={() => void submit()}
            testID="forgot-password-email"
          />
          {error !== undefined && (
            <FormMessage tone="error">{error}</FormMessage>
          )}
          <Button
            onPress={() => void submit()}
            disabled={submitting || !email.trim()}
            fullWidth
            size="lg"
            testID="forgot-password-submit"
          >
            {submitting ? t("submitLoading") : t("submit")}
          </Button>
        </View>
      )}
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
  sent: {
    gap: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface700,
  },
});
