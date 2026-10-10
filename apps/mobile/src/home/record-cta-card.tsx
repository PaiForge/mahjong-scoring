import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { useAuth } from "../auth/use-auth";
import { Button } from "../components/button";
import { SectionTitle } from "../components/section-title";
import { TextLink } from "../components/text-link";
import { panelFrame } from "../lib/panel-styles";
import { colors } from "../lib/theme";

/**
 * 記録の案内（web の練習の結果画面の登録 CTA `SignUpCta`）
 * 登録導線
 *
 * アプリはログインが任意で、ゲストに見える常設のログイン・登録の入口は無い。
 * 記録が残る道があることをホームで知らせる。マイページも、記録が残らない
 * 人には中身の代わりにこれを出す。
 *
 * - ゲスト — 「無料登録」と「ログイン」。文言は web の結果画面の CTA
 *   （`challenge.signUpCta`）をそのまま使い、得られるもの（スコアの記録・
 *   経験値）の言い方を web とそろえる
 * - ログイン中でユーザー名を決めていない — 「ユーザー名を決める」。記録は
 *   ユーザー名を決めた人にだけ残るので、登録はまだ途中。登録済みの人に
 *   「登録」は見せない
 * - それ以外（記録が残る人・ログインを出せないビルド・状態を読んでいる間・
 *   アカウントを読めなかったとき）は何も出さない。読めなかったときの再試行は
 *   設定のアカウントの節が持つ
 *
 * 表示だけのカードなので細枠に淡い緑の地（web の `bg-primary-50/60`）。
 * 押して始める面は中のボタンだけ。Pro・購入には触れない（アプリでは扱わない）。
 */
export function RecordCtaCard({
  testIDPrefix = "home",
}: {
  /** ボタンの `testID` の接頭辞（`<接頭辞>-sign-up-cta` 等）。置いた画面の名前 */
  readonly testIDPrefix?: string;
}) {
  const { status, account } = useAuth();
  if (status === "signedOut") return <SignUpCta testIDPrefix={testIDPrefix} />;
  if (status === "signedIn" && account?.profile === null)
    return <UsernameCta testIDPrefix={testIDPrefix} />;
  return undefined;
}

function SignUpCta({ testIDPrefix }: { readonly testIDPrefix: string }) {
  const t = useTranslations("challenge.signUpCta");
  const router = useRouter();
  return (
    <CtaFrame
      title={t("sectionTitle")}
      message={t("message")}
      description={t("description")}
    >
      <Button
        size="lg"
        fullWidth
        testID={`${testIDPrefix}-sign-up-cta`}
        onPress={() => router.push("/sign-up")}
      >
        {t("cta")}
      </Button>
      <TextLink onPress={() => router.push("/sign-in")}>
        {t("signInLink")}
      </TextLink>
    </CtaFrame>
  );
}

function UsernameCta({ testIDPrefix }: { readonly testIDPrefix: string }) {
  const tTitle = useTranslations("challenge.signUpCta");
  const t = useTranslations("dashboard.usernameCta");
  const router = useRouter();
  return (
    <CtaFrame
      title={tTitle("sectionTitle")}
      message={t("message")}
      description={t("description")}
    >
      <Button
        size="lg"
        fullWidth
        testID={`${testIDPrefix}-username-cta`}
        onPress={() => router.push("/mypage/setup-username")}
      >
        {t("cta")}
      </Button>
    </CtaFrame>
  );
}

function CtaFrame({
  title,
  message,
  description,
  children,
}: {
  readonly title: string;
  readonly message: string;
  readonly description: string;
  readonly children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <SectionTitle>{title}</SectionTitle>
      <View style={[panelFrame, styles.card]}>
        <View style={styles.texts}>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={styles.actions}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  card: {
    gap: 16,
    padding: 16,
    backgroundColor: colors.brandSubtle,
  },
  texts: {
    gap: 4,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.surface900,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface600,
  },
  // ボタンとその下の補助リンクの間は web の `SUB_LINK_GAP`（16）
  actions: {
    gap: 16,
    alignItems: "center",
  },
});
