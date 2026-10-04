import { getTranslations } from "next-intl/server";

import { scorePracticePlayHref } from "@/app/(user)/(public)/practice/score/_lib/play-href";
import { PracticeLinkButton } from "@/app/(user)/_components/practice-link-button";
import { PracticeLinkSection } from "../../_components/practice-link-card";

import { ChapterColumn } from "../../_components/chapter-column";
import { FixedFuScoreTable } from "../../_components/fixed-fu-score-table";
import { CHIITOITSU_SCORE_TABLE } from "../../_lib/fixed-fu-rows";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";

interface ChiitoitsuScoreGuideProps {
  /**
   * 章末の練習への導線を出すか。レッスンの説明として出すときは出さない —
   * 説明のすぐ下に「確認問題へ」のボタンがあり、押して始めるボタンが 2 つ
   * 並んで確認問題の前に練習へ逸れる
   */
  readonly showPracticeLink?: boolean;
}

/**
 * 七対子での点数計算 — 点数の計算セクション第1章
 */
export async function ChiitoitsuScoreGuide({
  showPracticeLink = true,
}: ChiitoitsuScoreGuideProps = {}) {
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

      {/* 対応する練習は自由練習（役絞り込み）でカタログ外のため、
          共通レイアウトの practiceLinks ではなく章本文が導線を持つ。
          七対子のみ・満貫未満 = 章の内容そのまま「必ず 25符 × 2〜4翻」の
          手牌だけが出題される */}
      {showPracticeLink && (
        <PracticeLinkSection>
          <PracticeLinkButton
            href={scorePracticePlayHref({
              yaku: ["七対子"],
              ranges: ["nonMangan"],
            })}
            label={t("practiceCta")}
          />
        </PracticeLinkSection>
      )}
    </div>
  );
}
