import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { MYPAGE_PLAN_PATH } from "@mahjong-scoring/features/routes";

import { useAuth } from "../../auth/use-auth";
import { IAP_AVAILABLE } from "../../billing/iap-availability";
import { TextLink } from "../../components/text-link";
import { colors } from "../../lib/theme";

interface PracticeQuotaRemainingProps {
  /** 今日の残り。無制限（`"unlimited"`）とまだ聞いていない（undefined）は出さない */
  readonly remaining: number | "unlimited" | undefined;
  /** プラン画面への導線を添えるか。1 問の最初の段階（解答前）だけ true を渡す */
  readonly showPlanLink: boolean;
}

/**
 * 無料枠の残り回数の表示（web の `PracticeQuotaRemaining`）
 * 残り回数表示
 *
 * 「今日はあと n 問」。0 なら「この問題で最後」を警告色で出す（次の問題へ
 * 進むとペイウォールになることを、押す前に気づかせる）。無制限のときは
 * 何も出さない。「無料」と書かない理由とリンクを解答前に限る理由は web と同じ
 * （何か操作すると課金されると読める・解答後のボタンの連打で押し間違える）。
 *
 * 導線は web の料金ページではなくアプリのプラン画面へ。ログイン中だけ出す —
 * ゲストはログインが先で、ペイウォールがそれを勧める。
 */
export function PracticeQuotaRemaining({
  remaining,
  showPlanLink,
}: PracticeQuotaRemainingProps) {
  const t = useTranslations("practiceQuota");
  const router = useRouter();
  const { status } = useAuth();
  if (typeof remaining !== "number") return null;

  return (
    <View style={styles.root}>
      <Text
        style={[styles.text, remaining === 0 && styles.last]}
        testID="practice-quota-remaining"
      >
        {t("remaining", { count: remaining })}
      </Text>
      {showPlanLink && IAP_AVAILABLE && status === "signedIn" && (
        <TextLink onPress={() => router.push(MYPAGE_PLAN_PATH)}>
          {t("planLink")}
        </TextLink>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    gap: 4,
  },
  text: {
    textAlign: "center",
    fontSize: 13,
    color: colors.surface500,
  },
  last: {
    fontWeight: "700",
    color: colors.warning,
  },
});
