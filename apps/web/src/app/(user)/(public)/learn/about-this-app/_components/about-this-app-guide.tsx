import { getTranslations } from "next-intl/server";
import { SectionTitle } from "@/app/_components/section-title";
import { GuideParagraph } from "../../_components/guide-paragraph";

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
        <ol className="list-decimal space-y-1 pl-6 whitespace-pre-line text-sm leading-relaxed text-surface-700">
          <li>{t("reason1Summary")}</li>
          <li>{t("reason2Summary")}</li>
          <li>{t("reason3Summary")}</li>
        </ol>
      </section>

      <section className="space-y-3">
        <SectionTitle>{t("reason1Title")}</SectionTitle>
        <GuideParagraph preLine>{t("reason1Body1")}</GuideParagraph>
        <p className="text-sm leading-relaxed text-surface-500">
          {t("reason1Note")}
        </p>
        <GuideParagraph preLine>{t("reason1Body2")}</GuideParagraph>
      </section>

      <section className="space-y-3">
        <SectionTitle>{t("reason2Title")}</SectionTitle>
        <GuideParagraph preLine>{t("reason2Body1")}</GuideParagraph>
        <GuideParagraph preLine>{t("reason2Body2")}</GuideParagraph>
      </section>

      <section className="space-y-3">
        <SectionTitle>{t("reason3Title")}</SectionTitle>
        <GuideParagraph preLine>{t("reason3Body1")}</GuideParagraph>
        <GuideParagraph preLine>{t("reason3Body2")}</GuideParagraph>
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
