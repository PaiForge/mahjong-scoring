import { useCallback, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslations } from "use-intl";

import { fetchBanNotice } from "../auth/account-api";
import { refreshAccount, useAuth } from "../auth/use-auth";
import { TextLink } from "../components/text-link";
import { SITE_URL } from "../lib/app-site-url";
import { panelFrame } from "../lib/panel-styles";
import { colors, radius } from "../lib/theme";

/** 理由を読んだ結果。読めなければ理由の行を出さない（知らせ自体は出す） */
type ReasonState =
  | { readonly kind: "loading" }
  | { readonly kind: "loaded"; readonly reason: string | null }
  | { readonly kind: "failed" };

/**
 * アカウントの停止の知らせ（web の BAN のページ `/banned`）
 * BAN 通知
 *
 * アカウント状態の API が `banned` を返した人に、web と同じ見出し・本文・
 * 理由（運営が BAN のときに書いたもの）・問い合わせの案内を出す。問い合わせは
 * マイページの「その他」と同じく web のページをブラウザで開く。
 *
 * web は BAN 中の人をどのページからも `/banned` へ送るが、アプリはゲストでも
 * 使える練習・レッスンをそのまま開かせる（記録・試験・購入はサーバーが弾く）。
 * そのため専用の画面へ閉じ込めず、記録とアカウントが並ぶ場所（マイページ・
 * アカウント）でだけこれを出す。
 *
 * 画面を開くたびに読み直し、BAN が解けていたらアカウント状態を読み直して
 * いつもの画面へ戻す。
 */
export function BanNotice() {
  const t = useTranslations("banned");
  const tFooter = useTranslations("footer");
  const { user } = useAuth();
  const userId = user?.id;
  const [state, setState] = useState<ReasonState>({ kind: "loading" });

  useFocusEffect(
    useCallback(() => {
      if (userId === undefined) return;
      let active = true;
      void fetchBanNotice().then((result) => {
        if (!active) return;
        if ("error" in result) {
          setState({ kind: "failed" });
          return;
        }
        if (!result.banned) {
          void refreshAccount();
          return;
        }
        setState({ kind: "loaded", reason: result.reason });
      });
      return () => {
        active = false;
      };
    }, [userId]),
  );

  return (
    <View style={[panelFrame, styles.card]} testID="ban-notice">
      <Text style={styles.title} accessibilityRole="header">
        {t("title")}
      </Text>
      <Text style={styles.body}>{t("message")}</Text>
      {state.kind === "loaded" && state.reason !== null && (
        <Text style={styles.reason}>
          {t("reason", { reason: state.reason })}
        </Text>
      )}
      <Text style={styles.body}>{t("contact")}</Text>
      <View style={styles.link}>
        <TextLink
          onPress={() => void Linking.openURL(`${SITE_URL}/contact`)}
          testID="ban-notice-contact"
        >
          {tFooter("contact")}
        </TextLink>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    padding: 16,
  },
  title: {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "700",
    color: colors.surface900,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface700,
  },
  // web の `bg-destructive-subtle text-destructive-strong` の帯
  reason: {
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 23,
    color: colors.destructiveStrong,
    backgroundColor: colors.destructiveSubtle,
    overflow: "hidden",
  },
  link: {
    alignItems: "flex-start",
    marginLeft: -8,
  },
});
