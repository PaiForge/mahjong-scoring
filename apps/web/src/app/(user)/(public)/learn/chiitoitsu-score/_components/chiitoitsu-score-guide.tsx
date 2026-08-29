import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";
import { scorePracticePlayHref } from "@/app/(user)/(public)/practice/score/_lib/play-href";
import {
  PracticeLinkButton,
  PracticeLinkSection,
} from "../../_components/practice-link-card";

import { GuideColumn } from "../../_components/guide-column";
import { FixedFuScoreTable } from "../../_components/fixed-fu-score-table";
import { CHIITOITSU_SCORE_TABLE } from "../../_lib/fixed-fu-rows";
import { GuideParagraph } from "../../_components/guide-paragraph";

/**
 * 七対子での点数計算 — 点数の計算セクション第1章
 */
export async function ChiitoitsuScoreGuide() {
  const t = await getTranslations("chiitoitsuScore.learn");

  return (
    <div className="space-y-10">
      {/* 符が1通りしかないことと、その点数表 */}
      <section className="space-y-4">
        <SectionTitle>{t("onePatternTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("onePatternBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("onePatternBody2")}</GuideParagraph>

        <FixedFuScoreTable role="ko" shape={CHIITOITSU_SCORE_TABLE} />
        <FixedFuScoreTable role="oya" shape={CHIITOITSU_SCORE_TABLE} />
      </section>

      {/* コラム: 25符だけが10符刻みから外れている理由 */}
      <GuideColumn label={t("columnLabel")} title={t("columnTitle")}>
        <GuideParagraph>
          {t.rich("columnBody", { br: () => <br /> })}
        </GuideParagraph>
      </GuideColumn>

      {/* 複合しても符は変わらない */}
      <section className="space-y-4">
        <SectionTitle>{t("compositeTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("compositeBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("compositeBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("compositeBody3")}</GuideParagraph>
      </section>

      {/* 対応する練習は自由練習（役絞り込み）でカタログ外のため、
          共通レイアウトの practiceHrefs ではなく章本文が導線を持つ。
          七対子のみ・満貫未満 = 章の内容そのまま「必ず 25符 × 2〜4翻」の
          手牌だけが出題される */}
      <PracticeLinkSection>
        <PracticeLinkButton
          href={scorePracticePlayHref({
            yaku: ["七対子"],
            ranges: ["nonMangan"],
          })}
          label={t("practiceCta")}
        />
      </PracticeLinkSection>
    </div>
  );
}
