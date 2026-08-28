import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import {
  PREFERENCE_ANCHORS,
  preferencesHref,
} from "@/app/(user)/(public)/preferences/_lib/anchors";
import { scorePracticePlayHref } from "@/app/(user)/(public)/practice/score/_lib/play-href";
import { PracticeLinkButton } from "../../_components/practice-link-card";

import { GuideNote } from "../../_components/guide-note";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { FixedFuScoreTable } from "../../_components/fixed-fu-score-table";

/**
 * ピンフの点数表の形。
 *
 * ツモは副底20符のまま（ツモ符が乗らない）、ロンは門前ロンの加符が乗って
 * 30符。5翻以上は符が点数に関与しなくなる（満貫以上の章が受け持つ）ため
 * 4翻まで。1翻ツモの欄が空くのは表側の `isInvalidCell` が判定する。
 */
const PINFU_TABLE = { tsumoFu: 20, ronFu: 30, hanCols: [1, 2, 3, 4] } as const;

/**
 * 平和での点数計算 — 点数の計算セクション第2章
 */
export async function PinfuScoreGuide() {
  const [t, tChapter] = await Promise.all([
    getTranslations("pinfuScore.learn"),
    getTranslations("learnCurriculum.chapter"),
  ]);

  return (
    <div className="space-y-10">
      {/* 2パターンしかないことと、その点数表 */}
      <section className="space-y-4">
        <SectionTitle>{t("twoPatternsTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("twoPatternsBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("twoPatternsBody2")}</GuideParagraph>

        <FixedFuScoreTable role="ko" {...PINFU_TABLE} />
        <FixedFuScoreTable role="oya" {...PINFU_TABLE} />
        <GuideNote>{t("noTsumoNote")}</GuideNote>

        <GuideParagraph preLine>{t("twoPatternsBody3")}</GuideParagraph>
      </section>

      {/* コラム: 切り上げ満貫 — 表の4翻の行だけがルールで変わる */}
      <HighlightPanel>
        <div className="mb-2 inline-flex items-center rounded-full bg-amber-200/70 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-amber-800">
          {t("columnLabel")}
        </div>
        <h3 className="mb-2 text-sm font-semibold text-surface-900">
          {t("columnTitle")}
        </h3>
        <div className="space-y-2">
          <GuideParagraph>
            {t.rich("columnBody", { br: () => <br /> })}
          </GuideParagraph>
          <GuideNote>
            {t.rich("columnSettingsNote", {
              settingsLink: (chunks) => (
                <Link
                  href={preferencesHref(PREFERENCE_ANCHORS.kiriageMangan)}
                  className={TEXT_LINK_CLASSES}
                >
                  {chunks}
                </Link>
              ),
            })}
          </GuideNote>
        </div>
      </HighlightPanel>

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
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-surface-900">
          {tChapter("practiceLinksTitle")}
        </h2>
        <PracticeLinkButton
          href={scorePracticePlayHref({
            yaku: ["平和"],
            ranges: ["nonMangan"],
          })}
          label={t("practiceCta")}
        />
      </section>
    </div>
  );
}
