import { getTranslations } from "next-intl/server";
import { ChapterLink } from "../../_components/chapter-link";
import { GuideNote } from "../../_components/guide-note";
import { GuideOrderedList } from "../../_components/guide-ordered-list";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { GuideSubsectionTitle } from "../../_components/guide-subsection-title";

/**
 * 点数計算ができるようにならない理由 — 「このアプリについて」のコラム
 */
export async function WhyScoringIsHardToLearnGuide() {
  const t = await getTranslations("whyScoringIsHardToLearn.learn");

  return (
    <div className="space-y-10">
      <GuideSection title={t("reasonsTitle")}>
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
      </GuideSection>

      <GuideSection title={t("afterwordTitle")}>
        <GuideParagraph>
          {t.rich("afterword", {
            link: () => <ChapterLink slug="about-this-app" />,
          })}
        </GuideParagraph>
      </GuideSection>
    </div>
  );
}
