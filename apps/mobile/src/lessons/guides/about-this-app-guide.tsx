import { useTranslations } from "use-intl";

import { SectionTitle } from "../../components/section-title";
import { GuideBody, GuideStack } from "../components/guide-section";
import {
  GuideNote,
  GuideOrderedList,
  GuideParagraph,
  GuideSubsectionTitle,
} from "../components/guide-text";

/**
 * このアプリについて — 基礎セクション第 1 章（web の `AboutThisAppGuide`）
 */
export function AboutThisAppGuide() {
  const t = useTranslations("aboutThisApp.learn");

  return (
    <GuideBody>
      <GuideStack>
        <SectionTitle>{t("introTitle")}</SectionTitle>
        <GuideParagraph>{t("lead1")}</GuideParagraph>
        <GuideParagraph>{t("lead2")}</GuideParagraph>
        <GuideOrderedList
          items={[
            t("reason1Summary"),
            t("reason2Summary"),
            t("reason3Summary"),
          ]}
        />

        <GuideStack gap={32}>
          <GuideStack>
            <GuideSubsectionTitle number={1}>
              {t("reason1Title")}
            </GuideSubsectionTitle>
            <GuideParagraph>{t("reason1Body1")}</GuideParagraph>
            <GuideNote>{t("reason1Note")}</GuideNote>
            <GuideParagraph>{t("reason1Body2")}</GuideParagraph>
          </GuideStack>

          <GuideStack>
            <GuideSubsectionTitle number={2}>
              {t("reason2Title")}
            </GuideSubsectionTitle>
            <GuideParagraph>{t("reason2Body1")}</GuideParagraph>
            <GuideParagraph>{t("reason2Body2")}</GuideParagraph>
          </GuideStack>

          <GuideStack>
            <GuideSubsectionTitle number={3}>
              {t("reason3Title")}
            </GuideSubsectionTitle>
            <GuideParagraph>{t("reason3Body1")}</GuideParagraph>
            <GuideParagraph>{t("reason3Body2")}</GuideParagraph>
          </GuideStack>
        </GuideStack>
      </GuideStack>

      <GuideStack>
        <SectionTitle>{t("purposeTitle")}</SectionTitle>
        <GuideParagraph>{t("purposeBody1")}</GuideParagraph>
        <GuideParagraph>{t("purposeBody2")}</GuideParagraph>
        <GuideParagraph>{t("purposeBody3")}</GuideParagraph>
        <GuideParagraph>{t("purposeBody4")}</GuideParagraph>
        <GuideParagraph>{t("purposeBody5")}</GuideParagraph>
        <GuideParagraph>{t("purposeBody6")}</GuideParagraph>
        <GuideParagraph>{t("closing")}</GuideParagraph>
      </GuideStack>
    </GuideBody>
  );
}
