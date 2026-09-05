import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";
import { PREFERENCE_ANCHORS } from "@/app/(user)/(public)/preferences/_lib/anchors";
import { scorePracticePlayHref } from "@/app/(user)/(public)/practice/score/_lib/play-href";
import {
  PracticeLinkButton,
  PracticeLinkSection,
} from "../../_components/practice-link-card";

import { ChapterColumn } from "../../_components/chapter-column";
import { PreferenceSettingsNote } from "../../_components/preference-settings-note";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { FixedFuScoreTable } from "../../_components/fixed-fu-score-table";
import { PINFU_SCORE_TABLE } from "../../_lib/fixed-fu-rows";

/**
 * 平和での点数計算 — 点数の計算セクション第2章
 */
export async function PinfuScoreGuide() {
  const t = await getTranslations("pinfuScore.learn");

  return (
    <div className="space-y-10">
      {/* 2パターンしかないことと、その点数表 */}
      <section className="space-y-4">
        <SectionTitle>{t("twoPatternsTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("twoPatternsBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("twoPatternsBody2")}</GuideParagraph>

        <FixedFuScoreTable role="ko" shape={PINFU_SCORE_TABLE} />
        <FixedFuScoreTable role="oya" shape={PINFU_SCORE_TABLE} />

        <GuideParagraph preLine>{t("twoPatternsBody3")}</GuideParagraph>
      </section>

      {/* コラム: 切り上げ満貫 — 表の4翻の行だけがルールで変わる */}
      <ChapterColumn t={t}>
        <PreferenceSettingsNote
          t={t}
          anchor={PREFERENCE_ANCHORS.kiriageMangan}
        />
      </ChapterColumn>

      {/* なぜ20符・30符なのか */}
      <section className="space-y-4">
        <SectionTitle>{t("whyTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("whyBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("whyBody2")}</GuideParagraph>
      </section>

      {/* 複合しても符は変わらない */}
      <section className="space-y-4">
        <SectionTitle>{t("compositeTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("compositeBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("compositeBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("compositeBody3")}</GuideParagraph>
      </section>

      {/* 対応する練習は自由練習（役絞り込み）でカタログ外のため、
          共通レイアウトの practiceHrefs ではなく章本文が導線を持つ。
          平和のみ・満貫未満 = 章の内容そのまま「必ず 20符 or 30符 ×
          1〜4翻」の手牌だけが出題される */}
      <PracticeLinkSection>
        <PracticeLinkButton
          href={scorePracticePlayHref({
            yaku: ["平和"],
            ranges: ["nonMangan"],
          })}
          label={t("practiceCta")}
        />
      </PracticeLinkSection>
    </div>
  );
}
