import { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";
import type { BeginPracticeQuestionResult } from "@mahjong-scoring/features/quota/answer";
import {
  PRACTICE_QUOTA_LIMITS,
  type QuotaMenu,
} from "@mahjong-scoring/features/quota/limits";

import { useAuth } from "../../auth/use-auth";
import { IAP_AVAILABLE } from "../../billing/iap-availability";
import { usePlanOffers } from "../../billing/use-plan-offers";
import { Chip } from "../../components/chip";
import { InfinityIcon } from "../../components/icons/icons";
import { TextLink } from "../../components/text-link";
import { colors } from "../../lib/theme";
import { peekPracticeQuotaAnswer } from "./use-practice-quota";

/**
 * 今日の残り。読み込み中は `loading`、確かめられなければ `unavailable`
 */
type EntryQuotaState =
  | { readonly kind: "loading" }
  | { readonly kind: "unavailable" }
  | { readonly kind: "loaded"; readonly quota: BeginPracticeQuestionResult };

/**
 * 練習一覧のカードの下に出す今日の利用枠（web の `PracticeEntryQuota`）
 * 入口の利用枠
 *
 * 枠を消費せずに読み（盤面の残数の取り直しと同じ経路）、始める前に残りと
 * 利用条件を伝える。読み込み中 / 確認できない / Pro の無制限 / 残り n 問 /
 * 本日分終了、ゲストには「ログインすると 1 日 n 問」を添える。画面が前面に
 * 戻るたびに読み直す（盤面で解いた・ログインした・購入した後に戻ってくる）。
 *
 * iOS で販売中のときだけ出す。Android と販売していない間は回数制限が無く、
 * 出す中身が無い。web の「Pro なら回数無制限」（料金ページへのリンク）は
 * 出さない — アプリの外での購入への誘導と読まれうる（審査ガイドライン 3.1.1）。
 * Pro の案内はペイウォールとマイページのプラン画面が持つ。
 */
export function PracticeEntryQuota({ menu }: { readonly menu: QuotaMenu }) {
  const offers = usePlanOffers();
  if (!IAP_AVAILABLE || offers === undefined || offers.length === 0)
    return null;
  return <EntryQuota menu={menu} />;
}

function EntryQuota({ menu }: { readonly menu: QuotaMenu }) {
  const t = useTranslations("practiceQuota.entry");
  const tQuota = useTranslations("practiceQuota");
  const router = useRouter();
  const { status } = useAuth();
  const [state, setState] = useState<EntryQuotaState>({ kind: "loading" });
  // 古い要求の結果が新しい要求の結果を上書きしないよう、最後の要求だけを採る
  const latest = useRef(0);

  // ログインの状態が変わったら（ログイン・ログアウト）数え方が変わるので読み直す
  useFocusEffect(
    useCallback(() => {
      if (status === "loading") return;
      const request = ++latest.current;
      void peekPracticeQuotaAnswer(menu).then((quota) => {
        if (request !== latest.current) return;
        setState(
          quota === undefined
            ? { kind: "unavailable" }
            : { kind: "loaded", quota },
        );
      });
    }, [menu, status]),
  );

  const body = (() => {
    if (state.kind === "loading")
      return <Text style={styles.text}>{t("loading")}</Text>;
    if (state.kind === "unavailable")
      return <Text style={styles.text}>{t("unavailable")}</Text>;
    const { quota } = state;
    if (quota.remaining === "unlimited") {
      return quota.benefits.includes(PlanBenefit.UnlimitedPractice) ? (
        <View style={styles.pro}>
          <Chip tone="amber">{tQuota("proBadge")}</Chip>
          <InfinityIcon size={16} color={colors.surface900} />
          <Text style={styles.strong}>{t("proUnlimited")}</Text>
        </View>
      ) : (
        <Text style={styles.strong}>{t("unlimited")}</Text>
      );
    }
    return (
      <>
        <Text style={styles.strong}>
          {quota.remaining === 0
            ? t("exhausted")
            : t("remaining", {
                remaining: quota.remaining,
                limit: quota.limit,
              })}
        </Text>
        {quota.remaining === 0 && <Text style={styles.text}>{t("reset")}</Text>}
        {!quota.signedIn && (
          <TextLink
            onPress={() => router.push("/sign-in")}
            testID={`practice-entry-quota-sign-in-${menu}`}
          >
            {t("signIn", { limit: PRACTICE_QUOTA_LIMITS[menu].signedIn })}
          </TextLink>
        )}
      </>
    );
  })();

  return (
    <View
      style={styles.root}
      accessibilityLiveRegion="polite"
      testID={`practice-entry-quota-${menu}`}
    >
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  // 読み込み中から結果へ切り替わるときの高さの跳ねを抑える（web の min-h-16）
  root: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  text: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
    color: colors.surface500,
  },
  strong: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.surface900,
  },
  pro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
