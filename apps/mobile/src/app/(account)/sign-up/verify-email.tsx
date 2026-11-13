/**
 * メール確認待ち
 *
 * @description 確認メールを送った後の案内と再送（web の `/sign-up/verify-email`
 * と同じ構成）。確認が済んだらログインへ戻ってもらう。登録の直後だけでなく、
 * 確認が済んでいないままログインしようとした人もログインの画面からここへ来て
 * 再送できる（画面を離れた後に再送する入口）。
 *
 * 届かないときの案内は web と同じ: 打ち間違いなら登録からやり直す一文と、再送の
 * 後のクールダウン（`useResendCooldown`）。やり直しは登録のフォームへ戻す —
 * 登録から来たならスタックにあるそのフォーム（入力した値が残り、誤りだけ
 * 直せる）、ログインから来たならログインごと登録に置き換える。
 * 「ログイン画面へ」も同じく、登録から来たなら登録ごとログインに置き換え、
 * 登録に使ったメールアドレスを入れて開く。どちらも入口の上に流れの画面を
 * 1 枚だけ残し、ログインやユーザー名の設定を終えて戻る 1 回で入口に帰す
 * （`useSwitchAuthScreen`）。
 * @flow 登録 / ログイン（確認が済んでいない）→ メール確認待ち →（メールのリンク）→ ログイン
 */
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslations } from "use-intl";
import { useResendCooldown } from "@mahjong-scoring/features/account/use-resend-cooldown";

import { isAuthRateLimited } from "../../../auth/auth-error-status";
import { FormMessage } from "../../../auth/form-message";
import { supabase } from "../../../auth/supabase-client";
import { useSwitchAuthScreen } from "../../../auth/use-switch-auth-screen";
import { Button } from "../../../components/button";
import { Screen } from "../../../components/screen";
import { SectionTitle } from "../../../components/section-title";
import { InlineTextLink } from "../../../lessons/components/chapter-link";
import { panelFrame } from "../../../lib/panel-styles";
import { colors } from "../../../lib/theme";

export default function VerifyEmailScreen() {
  const t = useTranslations("verifyEmail");
  const switchAuthScreen = useSwitchAuthScreen();
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const [resending, setResending] = useState(false);
  const { cooldown, start: startCooldown } = useResendCooldown();
  const [resendResult, setResendResult] = useState<
    { readonly tone: "error" | "success"; readonly text: string } | undefined
  >(undefined);

  const resend = async () => {
    if (!supabase || resending || cooldown > 0 || email === "") return;
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (!error) startCooldown();
    setResendResult(
      error
        ? {
            tone: "error",
            text: isAuthRateLimited(error.status)
              ? t("rateLimited")
              : t("resendError"),
          }
        : { tone: "success", text: t("resendSuccess") },
    );
  };

  return (
    <Screen title={t("pageTitle")} back contentStyle={styles.content}>
      <SectionTitle>{t("sectionTitle")}</SectionTitle>
      <View style={styles.sent}>
        {email === "" ? (
          <Text style={styles.body}>{t("sent")}</Text>
        ) : (
          <>
            <Text style={styles.body}>{t("sentTo")}</Text>
            <Text style={styles.email}>{email}</Text>
          </>
        )}
        <Text style={styles.body}>
          {t("checkInbox", { subject: t("mailSubject") })}
        </Text>
        <Text style={styles.body}>{t("returnToApp")}</Text>
      </View>
      <Button
        onPress={() =>
          switchAuthScreen("signIn", email === "" ? undefined : { email })
        }
        fullWidth
        size="lg"
        testID="verify-email-sign-in"
      >
        {t("goToSignIn")}
      </Button>
      <View style={[panelFrame, styles.trouble]}>
        <Text style={styles.troubleTitle}>{t("troubleTitle")}</Text>
        <Text style={styles.body}>{t("troubleDelay")}</Text>
        <Text style={styles.body}>{t("troubleSpam")}</Text>
        <Text style={styles.body} testID="sign-up-sent-typo">
          {t.rich("troubleTypo", {
            signUp: (chunks) => (
              <InlineTextLink onPress={() => switchAuthScreen("signUp")}>
                {chunks}
              </InlineTextLink>
            ),
          })}
        </Text>
        {email !== "" && (
          <>
            <Text style={styles.body}>{t("troubleResend")}</Text>
            <Button
              onPress={() => void resend()}
              variant="neutral"
              disabled={resending || cooldown > 0}
              fullWidth
              testID="sign-up-resend"
            >
              {resending
                ? t("resendLoading")
                : cooldown > 0
                  ? t("resendCooldown", { seconds: cooldown })
                  : t("resendButton")}
            </Button>
          </>
        )}
        {resendResult !== undefined && (
          <FormMessage tone={resendResult.tone}>
            {resendResult.text}
          </FormMessage>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 24,
  },
  sent: {
    gap: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface700,
  },
  email: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface900,
  },
  trouble: {
    padding: 16,
    gap: 8,
  },
  troubleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface800,
  },
});
