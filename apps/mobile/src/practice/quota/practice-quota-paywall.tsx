import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { MYPAGE_PLAN_PATH } from "@mahjong-scoring/features/routes";
import {
  PRACTICE_QUOTA_LIMITS,
  type QuotaMenu,
} from "@mahjong-scoring/features/quota/limits";

import { Button } from "../../components/button";
import { CheckIcon } from "../../components/icons/icons";
import { Screen } from "../../components/screen";
import { TextLink } from "../../components/text-link";
import { panelFrame } from "../../lib/panel-styles";
import { colors } from "../../lib/theme";

interface PracticeQuotaPaywallProps {
  /** 練習（ログインしたときの上限を引く） */
  readonly menu: QuotaMenu;
  /** 見出し（練習名）の辞書。`GenerationFailedNotice` と同じ */
  readonly translationNamespace: "agariScore" | "tenpaiScore";
  /** 使い切った上限 */
  readonly limit: number;
  /** ログインしているか（ユーザー名を決めていない人も含む） */
  readonly signedIn: boolean;
  readonly onBackToSetup: () => void;
}

/** Pro でできること（辞書のキー） */
const PERKS = ["perkUnlimited", "perkTools"] as const;

/**
 * 無料枠を使い切ったときに盤面の代わりに出すペイウォール（web の `PracticeQuotaPaywall`）
 * 練習ペイウォール
 *
 * 問題は生成していないので手牌は無い。盤面の代わりに出す画面
 * （`GenerationFailedNotice`）と同じ外枠に、理由・Pro でできること・導線を置く。
 *
 * - ゲスト: 先にログインを勧める（ログインすると枠が増える）。Pro は二の次で、
 *   ログインの下に説明だけを置く（購入はログインしてからプラン画面で行う）
 * - ログイン中: アプリのプラン画面（`MYPAGE_PLAN_PATH`）へ。ユーザー名を
 *   決めていない人はプラン画面がユーザー名の設定へ案内する
 *
 * @design web の料金ページへ送らない
 *
 * web の `planCta`（「Pro の料金・プランを見る」）と料金ページへのリンクは
 * 使わない。アプリの外での購入への誘導と読まれうる（審査ガイドライン 3.1.1）。
 * 購入はアプリのプラン画面のアプリ内課金だけで行う。
 *
 * ログインやプラン画面から戻ると、盤面のゲートが前面に戻ったのを見て
 * 聞き直す（`usePracticeQuota`）ので、枠が増えた・Pro になった人はそのまま
 * 次の問題へ進む。
 */
export function PracticeQuotaPaywall({
  menu,
  translationNamespace,
  limit,
  signedIn,
  onBackToSetup,
}: PracticeQuotaPaywallProps) {
  const t = useTranslations("practiceQuota.paywall");
  const tPractice = useTranslations(translationNamespace);
  const tPlan = useTranslations("mobilePlan");
  const router = useRouter();

  return (
    <Screen
      title={tPractice("title")}
      back
      backIcon="close"
      onBack={onBackToSetup}
      contentStyle={styles.content}
    >
      <View style={styles.lead} testID="practice-quota-paywall">
        <Text style={styles.title} accessibilityRole="header">
          {t("title")}
        </Text>
        <Text style={styles.body}>
          {signedIn
            ? t("bodySignedIn", { limit })
            : t("bodyAnonymous", {
                limit,
                signedInLimit: PRACTICE_QUOTA_LIMITS[menu].signedIn,
              })}
        </Text>
      </View>

      {!signedIn && (
        <View style={styles.cta}>
          <Button
            size="lg"
            fullWidth
            onPress={() => router.push("/sign-in")}
            testID="practice-quota-paywall-sign-in"
          >
            {t("signInCta")}
          </Button>
          <Text style={styles.hint}>{t("signUpHint")}</Text>
        </View>
      )}

      <View style={[panelFrame, styles.perks]}>
        <Text style={styles.perksTitle}>{t("perksTitle")}</Text>
        <View style={styles.perkList}>
          {PERKS.map((perk) => (
            <View key={perk} style={styles.perk}>
              <CheckIcon size={16} color={colors.success} />
              <Text style={styles.perkText}>{t(perk)}</Text>
            </View>
          ))}
        </View>
        {signedIn ? (
          <View style={styles.cta}>
            <Button
              size="lg"
              fullWidth
              onPress={() => router.push(MYPAGE_PLAN_PATH)}
              testID="practice-quota-paywall-plan"
            >
              {tPlan("paywallCta")}
            </Button>
            <Text style={styles.hint}>{t("noAutoRenew")}</Text>
          </View>
        ) : (
          <Text style={styles.hint}>{t("noAutoRenew")}</Text>
        )}
      </View>

      <View style={styles.footer}>
        <TextLink onPress={onBackToSetup} testID="practice-quota-paywall-back">
          {t("backToSetup")}
        </TextLink>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  lead: {
    gap: 16,
    paddingTop: 16,
  },
  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 32,
    color: colors.surface900,
  },
  body: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface700,
  },
  cta: {
    alignItems: "center",
    gap: 16,
  },
  hint: {
    textAlign: "center",
    fontSize: 13,
    color: colors.surface500,
  },
  perks: {
    backgroundColor: colors.brandSubtle,
    padding: 20,
    gap: 20,
  },
  perksTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface900,
  },
  perkList: {
    gap: 8,
  },
  perk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  perkText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface700,
  },
  footer: {
    alignItems: "center",
  },
});
