import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { useAuth } from "../auth/use-auth";
import { Button } from "../components/button";
import { TextLink } from "../components/text-link";
import { panelFrame } from "../lib/panel-styles";
import { colors } from "../lib/theme";

/**
 * 設定の会員限定ゲート（web の `MembersOnlyGate`）
 * 会員限定ゲート
 *
 * 設定はログイン中だけ使える（web と同じ）。ゲストには中身の代わりに登録・
 * ログインの案内を出す。web は中身をぼかして上に案内を重ねるが、ぼかしの
 * 重ね掛けはネイティブでは見慣れない形なので、案内のカードだけを置く。
 * 文言は web のゲート（`settings.membersGate`）と同じ。
 *
 * ゲストがここへ来るのは、レッスンの注記など設定の項目を指すリンクから。
 * 入口（マイページの「設定」の行）はログイン中にしか出さない。
 *
 * ログインを出せないビルド（接続先が無い）は登録できないので、ゲートを
 * 掛けずに中身を出す。保存したログイン状態を読んでいる間は中身も案内も出さない。
 */
export function MembersOnlyGate({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { status } = useAuth();
  if (status === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary500} />
      </View>
    );
  }
  if (status === "signedOut") return <MembersGateCard />;
  return children;
}

function MembersGateCard() {
  const t = useTranslations("settings.membersGate");
  const router = useRouter();
  return (
    <View style={[panelFrame, styles.card]} testID="preferences-members-gate">
      <View style={styles.texts}>
        <Text style={styles.title}>{t("title")}</Text>
        <Text style={styles.description}>{t("description")}</Text>
      </View>
      <View style={styles.actions}>
        <Button
          size="lg"
          fullWidth
          testID="preferences-members-gate-sign-up"
          onPress={() => router.push("/sign-up")}
        >
          {t("cta")}
        </Button>
        <TextLink onPress={() => router.push("/sign-in")}>
          {t("signInLink")}
        </TextLink>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 48,
    alignItems: "center",
  },
  card: {
    gap: 16,
    padding: 16,
    backgroundColor: colors.primary50,
  },
  texts: {
    gap: 4,
  },
  title: {
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
