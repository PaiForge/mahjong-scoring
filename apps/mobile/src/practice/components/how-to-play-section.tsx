import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { SectionTitle } from "../../components/section-title";
import { colors, radius } from "../../lib/theme";
import type { PracticeScreens } from "../practice-screens";

/**
 * 練習・模試の説明画面の「問題方式」セクション（web の `HowToPlaySection`）
 * 問題方式セクション
 *
 * 見出し + リード文 + デモを囲む枠。デモを持たない練習は、代わりに説明文
 * （`<namespace>.description`）を出す。デモは見せるだけなので、触れず読み上げない。
 *
 * @param namespace - 練習の辞書の名前空間
 * @param Demo - 枠の中に置く問題方式デモ
 */
export function HowToPlaySection({
  namespace,
  Demo,
}: {
  readonly namespace: string;
  readonly Demo: PracticeScreens["Demo"];
}) {
  const t = useTranslations(namespace);
  if (Demo === undefined) {
    return <Text style={styles.description}>{t("description")}</Text>;
  }
  return (
    <View style={styles.howToPlay}>
      <SectionTitle>{t("howToPlay.title")}</SectionTitle>
      <Text style={styles.lead}>{t("howToPlay.lead")}</Text>
      <View
        style={styles.demo}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Demo />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface500,
  },
  howToPlay: {
    gap: 12,
  },
  lead: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface900,
  },
  demo: {
    borderWidth: 1,
    borderColor: colors.panel,
    borderRadius: radius.panel,
    backgroundColor: colors.surface50,
    padding: 16,
  },
});
