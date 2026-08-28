import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";
import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import { scorePracticePlayHref } from "@/app/(user)/(public)/practice/score/_lib/play-href";
import { PracticeLinkButton } from "../../_components/practice-link-card";

import { FixedFuScoreTable } from "../../_components/fixed-fu-score-table";
import { GuideNote } from "../../_components/guide-note";
import { GuideParagraph } from "../../_components/guide-paragraph";

/**
 * 七対子の点数表の形。
 *
 * ツモ・ロンとも25符で変わらない。七対子は2翻からなので1翻の列は無く、
 * 5翻以上は符が点数に関与しなくなる（満貫以上の章が受け持つ）ため4翻まで。
 * 2翻ツモの欄が空くのは表側の `isInvalidCell` が判定する。
 */
const CHIITOITSU_TABLE = {
  tsumoFu: 25,
  ronFu: 25,
  hanCols: [2, 3, 4],
} as const;

/**
 * 七対子での点数計算 — 点数の計算セクション第2章
 */
export async function ChiitoitsuScoreGuide() {
  const [t, tChapter] = await Promise.all([
    getTranslations("chiitoitsuScore.learn"),
    getTranslations("learnCurriculum.chapter"),
  ]);

  return (
    <div className="space-y-10">
      {/* 符が1通りしかないことと、その点数表 */}
      <section className="space-y-4">
        <SectionTitle>{t("onePatternTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("onePatternBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("onePatternBody2")}</GuideParagraph>

        <FixedFuScoreTable role="ko" {...CHIITOITSU_TABLE} />
        <FixedFuScoreTable role="oya" {...CHIITOITSU_TABLE} />
        <GuideNote>{t("noTsumoNote")}</GuideNote>
      </section>

      {/* コラム: 25符だけが10符刻みから外れている理由 */}
      <HighlightPanel>
        <div className="mb-2 inline-flex items-center rounded-full bg-amber-200/70 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-amber-800">
          {t("columnLabel")}
        </div>
        <h3 className="mb-2 text-sm font-semibold text-surface-900">
          {t("columnTitle")}
        </h3>
        <GuideParagraph>
          {t.rich("columnBody", { br: () => <br /> })}
        </GuideParagraph>
      </HighlightPanel>

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
          手牌だけが出題される（平和の章と同じ形） */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-surface-900">
          {tChapter("practiceLinksTitle")}
        </h2>
        <PracticeLinkButton
          href={scorePracticePlayHref({
            yaku: ["七対子"],
            ranges: ["nonMangan"],
          })}
          label={t("practiceCta")}
        />
      </section>
    </div>
  );
}
