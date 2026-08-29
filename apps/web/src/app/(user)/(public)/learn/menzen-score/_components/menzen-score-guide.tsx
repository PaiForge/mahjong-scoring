import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";
import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import { scorePracticePlayHref } from "@/app/(user)/(public)/practice/score/_lib/play-href";
import { PracticeLinkButton } from "../../_components/practice-link-card";

import { GuideParagraph } from "../../_components/guide-paragraph";
import { ExtraFuTable } from "./extra-fu-table";

/**
 * 平和以外の門前面子手の点数計算 — 点数の計算セクション第3章
 */
export async function MenzenScoreGuide() {
  const [t, tChapter] = await Promise.all([
    getTranslations("menzenScore.learn"),
    getTranslations("learnCurriculum.chapter"),
  ]);

  return (
    <div className="space-y-10">
      {/* 出発点（ロン30符・ツモ22符）と、そこから必ず符が乗ること */}
      <section className="space-y-4">
        <SectionTitle>{t("startTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("startBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody3")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody4")}</GuideParagraph>
      </section>

      {/* 積み上げた符を10で切るという1つの規則と、その対応表 */}
      <section className="space-y-4">
        <SectionTitle>{t("roundTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("roundBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("roundBody2")}</GuideParagraph>

        <ExtraFuTable />

        <GuideParagraph preLine>{t("roundBody3")}</GuideParagraph>
        <GuideParagraph preLine>{t("roundBody4")}</GuideParagraph>
      </section>

      {/* コラム: 40符へ上がる境目。刻子の有無ではなく積み上げ10符が境 */}
      <HighlightPanel>
        <div className="mb-2 inline-flex items-center rounded-full bg-amber-200/70 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-amber-800">
          {t("columnLabel")}
        </div>
        <h3 className="mb-2 text-sm font-semibold text-surface-900">
          {t("columnTitle")}
        </h3>
        <div className="space-y-2">
          <GuideParagraph>
            {t.rich("columnBody1", { br: () => <br /> })}
          </GuideParagraph>
          <GuideParagraph>
            {t.rich("columnBody2", { br: () => <br /> })}
          </GuideParagraph>
        </div>
      </HighlightPanel>

      {/* 対応する練習は自由練習（門前縛り）でカタログ外のため、
          共通レイアウトの practiceHrefs ではなく章本文が導線を持つ。
          出題は門前・満貫未満に絞る（七対子は既定で生成対象外なので
          門前の面子手だけが出る）。この章で扱わない平和も混ざるが、
          直前の章で扱い終えているので腕試しとして成立する */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-surface-900">
          {tChapter("practiceLinksTitle")}
        </h2>
        <PracticeLinkButton
          href={scorePracticePlayHref({
            menzenOnly: true,
            ranges: ["nonMangan"],
          })}
          label={t("practiceCta")}
        />
      </section>
    </div>
  );
}
