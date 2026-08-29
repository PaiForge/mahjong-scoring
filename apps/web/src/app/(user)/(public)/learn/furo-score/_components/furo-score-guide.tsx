import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";
import { scorePracticePlayHref } from "@/app/(user)/(public)/practice/score/_lib/play-href";
import {
  PracticeLinkButton,
  PracticeLinkSection,
} from "../../_components/practice-link-card";

import { GuideColumn } from "../../_components/guide-column";
import { ExtraFuTable } from "../../_components/extra-fu-table";
import { GuideParagraph } from "../../_components/guide-paragraph";

/**
 * 鳴いた手の点数計算 — 点数の計算セクション第4章
 */
export async function FuroScoreGuide() {
  const t = await getTranslations("furoScore.learn");

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
      <GuideColumn label={t("columnLabel")} title={t("columnTitle")}>
        <GuideParagraph>
          {t.rich("columnBody1", { br: () => <br /> })}
        </GuideParagraph>
        <GuideParagraph>
          {t.rich("columnBody2", { br: () => <br /> })}
        </GuideParagraph>
      </GuideColumn>

      {/* 対応する練習は自由練習（副露縛り）でカタログ外のため、
          共通レイアウトの practiceHrefs ではなく章本文が導線を持つ */}
      <PracticeLinkSection>
        <PracticeLinkButton
          href={scorePracticePlayHref({
            handShape: "furo",
            ranges: ["nonMangan"],
          })}
          label={t("practiceCta")}
        />
      </PracticeLinkSection>
    </div>
  );
}
