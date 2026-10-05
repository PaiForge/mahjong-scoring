import { getTranslations } from "next-intl/server";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { GuideNote } from "../../_components/guide-note";
import { GuideOrderedList } from "../../_components/guide-ordered-list";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSubsectionTitle } from "../../_components/guide-subsection-title";

/**
 * このアプリについて — 新第 1 章
 */
export async function AboutThisAppGuide() {
  const t = await getTranslations("aboutThisApp.learn");

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <SectionTitle>{t("introTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("lead1")}</GuideParagraph>
        <GuideParagraph preLine>{t("lead2")}</GuideParagraph>
        <GuideOrderedList>
          <li>{t("reason1Summary")}</li>
          <li>{t("reason2Summary")}</li>
          <li>{t("reason3Summary")}</li>
        </GuideOrderedList>

        <div className="space-y-8 pt-3">
          <section className="space-y-3">
            <GuideSubsectionTitle number={1}>
              {t("reason1Title")}
            </GuideSubsectionTitle>
            <GuideParagraph preLine>{t("reason1Body1")}</GuideParagraph>
            <GuideNote>{t("reason1Note")}</GuideNote>
            <GuideParagraph preLine>{t("reason1Body2")}</GuideParagraph>
          </section>

          <section className="space-y-3">
            <GuideSubsectionTitle number={2}>
              {t("reason2Title")}
            </GuideSubsectionTitle>
            <GuideParagraph preLine>{t("reason2Body1")}</GuideParagraph>
            <GuideParagraph preLine>{t("reason2Body2")}</GuideParagraph>
          </section>

          <section className="space-y-3">
            <GuideSubsectionTitle number={3}>
              {t("reason3Title")}
            </GuideSubsectionTitle>
            <GuideParagraph preLine>{t("reason3Body1")}</GuideParagraph>
            <GuideParagraph preLine>{t("reason3Body2")}</GuideParagraph>
          </section>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>{t("purposeTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("purposeBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("purposeBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("purposeBody3")}</GuideParagraph>
        <GuideParagraph preLine>{t("purposeBody4")}</GuideParagraph>
        <GuideParagraph preLine>{t("purposeBody5")}</GuideParagraph>
        <GuideParagraph preLine>{t("purposeBody6")}</GuideParagraph>
        <GuideParagraph preLine>{t("closing")}</GuideParagraph>
      </section>
    </div>
  );
}
