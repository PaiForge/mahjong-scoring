import { getTranslations } from "next-intl/server";

import { scorePracticePlayHref } from "@/app/(user)/(public)/practice/score/_lib/play-href";
import { PracticeLinkButton } from "@/app/(user)/_components/practice-link-button";
import { PracticeLinkSection } from "../../_components/practice-link-card";

import { ChapterLink } from "../../_components/chapter-link";
import { GuideColumn } from "../../_components/guide-column";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { ExtraFuTable } from "../../_components/extra-fu-table";

/**
 * 平和以外の門前面子手の点数計算 — 点数の計算セクション第3章
 */
export async function MenzenMentsuScoreGuide() {
  const t = await getTranslations("menzenMentsuScore.learn");

  return (
    <div className="space-y-10">
      {/* 出発点（ロン30符・ツモ22符）と、そこから必ず符が乗ること */}
      <GuideSection title={t("startTitle")}>
        <GuideParagraph preLine>{t("startBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody3")}</GuideParagraph>
        <GuideParagraph preLine>{t("startBody4")}</GuideParagraph>
      </GuideSection>

      {/* 積み上げた符を10で切るという1つの規則と、その対応表 */}
      <GuideSection title={t("roundTitle")}>
        <GuideParagraph preLine>
          {t.rich("roundBody1", {
            mentsuLink: () => <ChapterLink slug="mentsu-fu" />,
            jantouLink: () => <ChapterLink slug="jantou-fu" />,
            machiLink: () => <ChapterLink slug="machi-fu" />,
          })}
        </GuideParagraph>
        <GuideParagraph preLine>{t("roundBody2")}</GuideParagraph>

        <ExtraFuTable handShape="menzen" />

        <GuideParagraph preLine>{t("roundBody3")}</GuideParagraph>
        <GuideParagraph preLine>{t("roundBody4")}</GuideParagraph>
      </GuideSection>

      {/* コラム: 40符へ上がる境目。刻子の有無ではなく積み上げ10符が境 */}
      <GuideColumn label={t("columnLabel")} title={t("columnTitle")}>
        <GuideParagraph>
          {t.rich("columnBody1", { br: () => <br /> })}
        </GuideParagraph>
        <GuideParagraph>
          {t.rich("columnBody2", { br: () => <br /> })}
        </GuideParagraph>
      </GuideColumn>

      {/* 対応する練習は自由練習（門前縛り）でカタログ外のため、
          共通レイアウトの practiceLinks ではなく章本文が導線を持つ。
          出題は門前・満貫未満に絞る（七対子は既定で生成対象外なので
          門前の面子手だけが出る）。この章で扱わない平和も混ざるが、
          直前の章で扱い終えているので腕試しとして成立する */}
      <PracticeLinkSection>
        <PracticeLinkButton
          href={scorePracticePlayHref({
            handShape: "menzen",
            ranges: ["nonMangan"],
          })}
          label={t("practiceCta")}
        />
      </PracticeLinkSection>
    </div>
  );
}
