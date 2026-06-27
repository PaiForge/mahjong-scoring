import { getTranslations } from "next-intl/server";
import { SectionTitle } from "@/app/_components/section-title";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { ManganOyaTsumoScoreTable } from "./mangan-oya-tsumo-score-table";

/**
 * 親のツモ（満貫以上） — 満貫以上セクション第 4 章
 */
export async function ManganOyaTsumoGuide() {
  const t = await getTranslations("manganOyaTsumo.learn");

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <SectionTitle>{t("bodyTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("body1")}</GuideParagraph>
        <GuideParagraph preLine>{t("body2")}</GuideParagraph>
        <ManganOyaTsumoScoreTable />
        <GuideParagraph preLine>{t("body3")}</GuideParagraph>
      </section>
    </div>
  );
}
