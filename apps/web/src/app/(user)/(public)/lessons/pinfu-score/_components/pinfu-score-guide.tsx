import { getTranslations } from "next-intl/server";

import { PREFERENCE_ANCHORS } from "@/app/(user)/(public)/preferences/_lib/anchors";

import { ChapterColumn } from "../../_components/chapter-column";
import { PreferenceSettingsNote } from "../../_components/preference-settings-note";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { FixedFuScoreTable } from "../../_components/fixed-fu-score-table";
import { PINFU_SCORE_TABLE } from "@mahjong-scoring/features/curriculum/fixed-fu-rows";

/**
 * 平和での点数計算 — 点数の計算セクション第2章
 */
export async function PinfuScoreGuide() {
  const t = await getTranslations("pinfuScore.learn");

  return (
    <div className="space-y-10">
      {/* 2パターンしかないことと、その点数表 */}
      <GuideSection title={t("twoPatternsTitle")}>
        <GuideParagraph preLine>{t("twoPatternsBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("twoPatternsBody2")}</GuideParagraph>

        <FixedFuScoreTable role="ko" shape={PINFU_SCORE_TABLE} />
        <FixedFuScoreTable role="oya" shape={PINFU_SCORE_TABLE} />

        <GuideParagraph preLine>{t("twoPatternsBody3")}</GuideParagraph>
      </GuideSection>

      {/* コラム: 切り上げ満貫 — 表の4翻の行だけがルールで変わる */}
      <ChapterColumn t={t}>
        <PreferenceSettingsNote
          t={t}
          anchor={PREFERENCE_ANCHORS.kiriageMangan}
        />
      </ChapterColumn>

      {/* なぜ20符・30符なのか */}
      <GuideSection title={t("whyTitle")}>
        <GuideParagraph preLine>{t("whyBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("whyBody2")}</GuideParagraph>
      </GuideSection>

      {/* 複合しても符は変わらない */}
      <GuideSection title={t("compositeTitle")}>
        <GuideParagraph preLine>{t("compositeBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("compositeBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("compositeBody3")}</GuideParagraph>
      </GuideSection>
    </div>
  );
}
