import { getTranslations } from "next-intl/server";

import { ChapterLink } from "../../_components/chapter-link";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { GuideSubsectionTitle } from "../../_components/guide-subsection-title";
import { TenpaneTable } from "../../_components/tenpane-table";

/**
 * 平和以外の門前面子手の点数計算 — 点数の計算セクション第3章
 */
export async function MenzenMentsuScoreGuide() {
  const t = await getTranslations("menzenMentsuScore.learn");

  return (
    <div className="space-y-10">
      {/* 出発点（ロン30符・ツモ22符）と、そこから必ず符が乗ること */}
      <GuideSection title={t("startTitle")}>
        <GuideParagraph preLine>{t("startBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody3")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody4")}</GuideParagraph>
      </GuideSection>

      {/* 足して切り上げる数え方と、ロン・ツモそれぞれのテンパネの典型 */}
      <GuideSection title={t("roundTitle")}>
        <GuideParagraph preLine>
          {t.rich("roundBody1", {
            mentsuLink: () => <ChapterLink slug="mentsu-fu" />,
            jantouLink: () => <ChapterLink slug="jantou-fu" />,
            machiLink: () => <ChapterLink slug="machi-fu" />,
          })}
        </GuideParagraph>
        <GuideParagraph preLine>{t("roundBody2")}</GuideParagraph>

        <GuideSubsectionTitle>{t("ronTitle")}</GuideSubsectionTitle>
        <TenpaneTable handShape="menzen" winType="ron" />
        <GuideParagraph preLine>{t("ronNote")}</GuideParagraph>

        <GuideSubsectionTitle>{t("tsumoTitle")}</GuideSubsectionTitle>
        <TenpaneTable handShape="menzen" winType="tsumo" />
        <GuideParagraph preLine>{t("tsumoNote")}</GuideParagraph>
      </GuideSection>
    </div>
  );
}
