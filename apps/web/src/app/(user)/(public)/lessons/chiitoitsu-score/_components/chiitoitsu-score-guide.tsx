import { getTranslations } from "next-intl/server";

import { ChapterColumn } from "../../_components/chapter-column";
import { FixedFuScoreTable } from "../../_components/fixed-fu-score-table";
import { CHIITOITSU_SCORE_TABLE } from "@mahjong-scoring/features/curriculum/fixed-fu-rows";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";

/**
 * 七対子での点数計算 — 点数の計算セクション第1章
 */
export async function ChiitoitsuScoreGuide() {
  const t = await getTranslations("chiitoitsuScore.learn");

  return (
    <div className="space-y-10">
      {/* 符が1通りしかないことと、その点数表 */}
      <GuideSection title={t("onePatternTitle")}>
        <GuideParagraph preLine>{t("onePatternBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("onePatternBody2")}</GuideParagraph>

        <FixedFuScoreTable role="ko" shape={CHIITOITSU_SCORE_TABLE} />
        <FixedFuScoreTable role="oya" shape={CHIITOITSU_SCORE_TABLE} />
      </GuideSection>

      {/* コラム: 25符だけが10符刻みから外れている理由 */}
      <ChapterColumn t={t} />

      {/* 複合しても符は変わらない */}
      <GuideSection title={t("compositeTitle")}>
        <GuideParagraph preLine>{t("compositeBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("compositeBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("compositeBody3")}</GuideParagraph>
      </GuideSection>
    </div>
  );
}
