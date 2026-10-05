import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { colors } from "../../lib/theme";
import { Formula } from "../components/formula";
import { GuideBody, GuideSection } from "../components/guide-section";
import { GuideParagraph } from "../components/guide-text";
import { HighlightPanel } from "../components/highlight-panel";

/**
 * 点数計算が複雑な理由 — 基礎セクション第 2 章（web の `WhyScoringIsComplexGuide`）
 *
 * web は公式と計算手順を KaTeX で組む。モバイルは同じ式を {@link Formula}
 * （文字の並び＋右肩の指数）で組み、手順の中の短い式は上付き文字で書く。
 */
export function WhyScoringIsComplexGuide() {
  const t = useTranslations("whyScoringIsComplex.learn");
  const tFormula = useTranslations("learnCurriculum.formula");
  const fu = tFormula("fu");
  const han = tFormula("han");

  const steps = [
    `${t("step1Prefix")}${fu}${t("step1Mid")}${han}${t("step1Suffix")}`,
    `${t("step2Prefix")}2⁽³⁺²⁾ = 2⁵ = 32${t("step2Suffix")}`,
    `${t("step3Prefix")}30 × 32 × 4${t("step3Suffix")}`,
    t("step4"),
  ];

  return (
    <GuideBody>
      <GuideSection title={t("scoringIsSimpleTitle")}>
        <GuideParagraph>{t("scoringIsSimpleBody1")}</GuideParagraph>
        <GuideParagraph>{t("scoringIsSimpleBody2")}</GuideParagraph>

        <Formula lines={[[`${fu} × 2`, { sup: `(${han} + 2)` }, " × 4"]]} />

        <GuideParagraph>{t("exampleIntro")}</GuideParagraph>

        {/* 計算手順 */}
        <HighlightPanel>
          <View style={styles.steps}>
            {steps.map((step, index) => (
              <View key={index} style={styles.step}>
                <Text style={styles.stepMarker}>{`${index + 1}.`}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <Formula
            lines={[
              ["30 × 2", { sup: "(3+2)" }, " × 4"],
              ["= 30 × 32 × 4"],
              ["= 960 × 4"],
              [`= 3840 →（${tFormula("ceil")}）3900`],
            ]}
          />
        </HighlightPanel>

        <GuideParagraph>{t("calculatorNote")}</GuideParagraph>
        <GuideParagraph>{t("memorizeNote")}</GuideParagraph>
        <GuideParagraph>{t("kuku")}</GuideParagraph>
        <GuideParagraph>{t("practiceNeeded")}</GuideParagraph>
      </GuideSection>
    </GuideBody>
  );
}

const styles = StyleSheet.create({
  steps: {
    gap: 4,
  },
  step: {
    flexDirection: "row",
    gap: 8,
    paddingLeft: 8,
  },
  stepMarker: {
    minWidth: 16,
    fontSize: 14,
    lineHeight: 24,
    color: colors.surface700,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 24,
    color: colors.surface700,
  },
});
