import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";
import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import { scorePracticePlayHref } from "@/app/(user)/(public)/practice/score/_lib/play-href";
import { PracticeLinkButton } from "../../_components/practice-link-card";

import { ExtraFuTable } from "../../_components/extra-fu-table";
import { GuideParagraph } from "../../_components/guide-paragraph";

/**
 * 鳴いた手の点数計算 — 点数の計算セクション第4章
 */
export async function FuroScoreGuide() {
  const [t, tChapter] = await Promise.all([
    getTranslations("furoScore.learn"),
    getTranslations("learnCurriculum.chapter"),
  ]);

  return (
    <div className="space-y-10">
      {/* 門前との差は門前加符の有無だけ、という一点に畳む */}
      <section className="space-y-4">
        <SectionTitle>{t("startTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("startBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody3")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody4")}</GuideParagraph>
      </section>

      {/* 門前と同じ規則。ロンの出発点だけが20符に下がる */}
      <section className="space-y-4">
        <SectionTitle>{t("roundTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("roundBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("roundBody2")}</GuideParagraph>

        <ExtraFuTable isMenzen={false} />

        <GuideParagraph preLine>{t("roundBody3")}</GuideParagraph>
      </section>

      {/* コラム: 表の一番上の行（積み上げ0符のロン）の読み方 */}
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

      {/* 対応する練習は自由練習（副露縛り）でカタログ外のため、
          共通レイアウトの practiceHrefs ではなく章本文が導線を持つ */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-surface-900">
          {tChapter("practiceLinksTitle")}
        </h2>
        <PracticeLinkButton
          href={scorePracticePlayHref({
            handShape: "furo",
            ranges: ["nonMangan"],
          })}
          label={t("practiceCta")}
        />
      </section>
    </div>
  );
}
