import { getTranslations } from "next-intl/server";
import { SectionTitle } from "@/app/_components/section-title";
import { GuideParagraph } from "../../_components/guide-paragraph";

/**
 * 子のツモ（満貫以上） — 満貫以上セクション第 3 章
 */
export async function ManganKoTsumoGuide() {
  const t = await getTranslations("manganKoTsumo.learn");

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <SectionTitle>{t("bodyTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("body1")}</GuideParagraph>
        <GuideParagraph preLine>{t("body2")}</GuideParagraph>
      </section>
    </div>
  );
}
