import { getTranslations } from "next-intl/server";
import { PREFERENCE_ANCHORS } from "@mahjong-scoring/features/settings/preference-anchors";

import { ChapterLink } from "../../_components/chapter-link";
import { ChapterColumn } from "../../_components/chapter-column";
import { GuideNote } from "../../_components/guide-note";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { PreferenceSettingsNote } from "../../_components/preference-settings-note";
import { OyaRonScoreTable } from "./oya-ron-score-table";

/**
 * 親ロンでの効率的な点数の覚え方 — 点数記憶術セクション第4章
 */
export async function OyaRonScoresGuide() {
  const t = await getTranslations("oyaRonScores.learn");

  return (
    <div className="space-y-10">
      {/* 規則の確認。満貫以上で規則が崩れないことは満貫の章が済ませている */}
      <GuideSection title={t("ruleTitle")}>
        <GuideParagraph preLine>{t("ruleBody1")}</GuideParagraph>
        <GuideParagraph preLine>
          {t.rich("ruleBody2", {
            link: () => <ChapterLink slug="mangan-oya-ron" />,
          })}
        </GuideParagraph>
      </GuideSection>

      {/* 満貫未満では切り上げのせいで規則が表に出ないマスがある */}
      <GuideSection title={t("gapTitle")}>
        <GuideParagraph preLine>{t("gapBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("gapBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("gapBody3")}</GuideParagraph>
        <GuideNote>
          {t.rich("ceilNote", {
            link: () => <ChapterLink slug="why-scoring-is-complex" />,
          })}
        </GuideNote>
      </GuideSection>

      {/* 本題。ずれるマスを表の上で示し、それだけを覚える対象にする */}
      <GuideSection title={t("memorizeTitle")}>
        <GuideParagraph preLine>{t("memorizeBody1")}</GuideParagraph>

        <OyaRonScoreTable caption={t("tableCaption")} />
        <GuideNote>{t("legendNote")}</GuideNote>

        <GuideParagraph preLine>{t("memorizeBody2")}</GuideParagraph>
      </GuideSection>

      {/* コラム: 切り上げ満貫を採ると、ずれるマスのうち2つが満貫に変わる */}
      <ChapterColumn t={t}>
        <PreferenceSettingsNote
          t={t}
          anchor={PREFERENCE_ANCHORS.kiriageMangan}
        />
      </ChapterColumn>
    </div>
  );
}
