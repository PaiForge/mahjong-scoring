import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import {
  PREFERENCE_ANCHORS,
  preferencesHref,
} from "@/app/(user)/(public)/preferences/_lib/anchors";

import { GuideNote } from "../../_components/guide-note";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { PinfuScoreTable } from "./pinfu-score-table";

/**
 * 平和での点数計算 — 点数の計算セクション第1章
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

        <PinfuScoreTable role="ko" />
        <PinfuScoreTable role="oya" />
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
    </div>
  );
}
