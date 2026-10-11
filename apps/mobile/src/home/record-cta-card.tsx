import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { useAuth } from "../auth/use-auth";
import { Button } from "../components/button";
import { TextLink } from "../components/text-link";
import { panelFrame } from "../lib/panel-styles";
import { colors } from "../lib/theme";

/** 記録の案内を置く画面。文言とボタンの `testID` の接頭辞を決める */
export type RecordCtaPlacement = "home" | "mypage";

/**
 * 記録の案内（web の練習の結果画面の登録 CTA `SignUpCta`）
 * 登録導線
 *
 * アプリはログインが任意で、ゲストに見える常設のログイン・登録の入口は無い。
 * 記録が残る道があることをホームで知らせる。マイページも、記録が残らない
 * 人には中身の代わりにこれを出す。
 *
 * - ゲスト — 「無料登録」と「ログイン」
 * - ログイン中でユーザー名を決めていない — 「ユーザー名を決める」。記録は
 *   ユーザー名を決めた人にだけ残るので、登録はまだ途中。登録済みの人に
 *   「登録」は見せない
 * - それ以外（記録が残る人・ログインを出せないビルド・状態を読んでいる間・
 *   アカウントを読めなかったとき）は何も出さない。読めなかったときの再試行は
 *   設定のアカウントの節が持つ
 *
 * 訴えることは置き場所で分ける（`recordCta.<placement>`）。web の結果画面の
 * CTA（`challenge.signUpCta`）は練習を終えた人に「スコアが記録される」と
 * 言うが、ホームで見るのはこれから学ぶ人なので、学習の進み具合が
 * アカウントに残る（機種変更しても消えず web でも続きから学べる）ことを言う。
 * ゲストでもレッスンの完了は端末に残り行程にも出るので、「記録できる」とは
 * 言わない。マイページは自分の記録を見に来た人なので、ここに何が並ぶかを言い、
 * 画面がその見本（`MypagePreview`）を添える。
 *
 * 見出しは持たない。カードの文言がそのまま言い切っており、見出しを足しても
 * 同じことを繰り返すだけになる。
 *
 * 表示だけのカードなので細枠に淡い緑の地（web の `bg-primary-50/60`）。
 * 押して始める面は中のボタンだけ。Pro・購入には触れない（アプリでは扱わない）。
 */
export function RecordCtaCard({
  placement,
}: {
  readonly placement: RecordCtaPlacement;
}) {
  const { status, account } = useAuth();
  if (status === "signedOut") return <SignUpCta placement={placement} />;
  if (status === "signedIn" && account?.profile === null)
    return <UsernameCta placement={placement} />;
  return undefined;
}

interface CtaProps {
  readonly placement: RecordCtaPlacement;
}

function SignUpCta({ placement }: CtaProps) {
  const t = useTranslations("recordCta");
  const router = useRouter();
  return (
    <CtaFrame
      message={t(`${placement}.signUp.message`)}
      description={t(`${placement}.signUp.description`)}
    >
      <Button
        size="lg"
        fullWidth
        testID={`${placement}-sign-up-cta`}
        onPress={() => router.push("/sign-up")}
      >
        {t("signUp")}
      </Button>
      <TextLink onPress={() => router.push("/sign-in")}>{t("signIn")}</TextLink>
    </CtaFrame>
  );
}

function UsernameCta({ placement }: CtaProps) {
  const t = useTranslations("recordCta");
  const router = useRouter();
  return (
    <CtaFrame
      message={t(`${placement}.username.message`)}
      description={t(`${placement}.username.description`)}
    >
      <Button
        size="lg"
        fullWidth
        testID={`${placement}-username-cta`}
        onPress={() => router.push("/mypage/setup-username")}
      >
        {t("setUsername")}
      </Button>
    </CtaFrame>
  );
}

function CtaFrame({
  message,
  description,
  children,
}: {
  readonly message: string;
  readonly description: string;
  readonly children: ReactNode;
}) {
  return (
    <View style={[panelFrame, styles.card]}>
      <View style={styles.texts}>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={styles.actions}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
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
