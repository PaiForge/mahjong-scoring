import { getTranslations } from "next-intl/server";
import { SectionTitle } from "@/app/_components/section-title";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { ManganScoreTable } from "../../_components/mangan-score-table";

/**
 * 子のロン（満貫以上） — 満貫以上セクション第 1 章
 */
export async function ManganKoRonGuide() {
  const t = await getTranslations("manganKoRon.learn");

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <SectionTitle>{t("bodyTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("body1")}</GuideParagraph>
        <GuideParagraph preLine>{t("body2")}</GuideParagraph>
        <ManganScoreTable role="ko" />
        <GuideParagraph preLine>{t("body3")}</GuideParagraph>
      </section>
    </div>
  );
}
