import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { ManganScoreCalculationHowToPlay } from "@/app/(user)/(public)/practice/mangan-score-calculation/_components/mangan-score-calculation-how-to-play";
import { TenpaiScorePreview } from "@/app/(user)/(public)/practice/tenpai-score/_components/tenpai-score-preview";
import {
  TENPAI_SCORE_PRACTICE_HREF,
  practiceHref,
} from "@mahjong-scoring/features/routes";
import { ChapterLink } from "../../_components/chapter-link";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { GuideSubsectionTitle } from "../../_components/guide-subsection-title";
import { ChallengePreview } from "./challenge-preview";
import { PracticePreview } from "./practice-preview";

/**
 * このアプリについて — 基礎セクション第 1 章
 *
 * 結論（アプリの特徴）から書く。特徴は 3 つで、どれも「点数計算でつまずき
 * やすいところ」への手当てになっている。その対応が先に読めるよう、各特徴の
 * 最初の段落でつまずきを、次の段落で手当てを書き、練習の実際の画面を添える。
 * つまずきそのものの話（作者の体験）はコラム `why-scoring-is-hard-to-learn` に
 * 分けてあり、導入からリンクする。
 */
export async function AboutThisAppGuide() {
  const [t, tPractice, tTenpai] = await Promise.all([
    getTranslations("aboutThisApp.learn"),
    getTranslations("practice.practices"),
    getTranslations("tenpaiScore"),
  ]);

  /** プレビューのキャプション。練習名は練習の辞書から引き、その練習へリンクする */
  const caption = (
    key: "feature1Preview" | "feature2Preview" | "feature3Preview",
    title: string,
    href: string,
  ): ReactNode =>
    t.rich(key, {
      title,
      link: (chunks) => (
        <Link href={href} className={TEXT_LINK_CLASSES}>
          {chunks}
        </Link>
      ),
    });

  return (
    <div className="space-y-10">
      <GuideSection title={t("introTitle")}>
        <GuideParagraph preLine>{t("lead1")}</GuideParagraph>
        <GuideParagraph>
          {t.rich("lead2", {
            link: () => <ChapterLink slug="why-scoring-is-hard-to-learn" />,
          })}
        </GuideParagraph>
      </GuideSection>

      <GuideSection title={t("featuresTitle")}>
        <div className="space-y-10">
          <section className="space-y-3">
            <GuideSubsectionTitle number={1}>
              {t("feature1Title")}
            </GuideSubsectionTitle>
            <GuideParagraph>{t("feature1Body1")}</GuideParagraph>
            <GuideParagraph>{t("feature1Body2")}</GuideParagraph>
            <PracticePreview
              caption={caption(
                "feature1Preview",
                tPractice("manganScoreCalculation.title"),
                practiceHref("mangan-score-calculation"),
              )}
            >
              <ManganScoreCalculationHowToPlay />
            </PracticePreview>
          </section>

          <section className="space-y-3">
            <GuideSubsectionTitle number={2}>
              {t("feature2Title")}
            </GuideSubsectionTitle>
            <GuideParagraph>{t("feature2Body1")}</GuideParagraph>
            <GuideParagraph>{t("feature2Body2")}</GuideParagraph>
            <PracticePreview
              caption={caption(
                "feature2Preview",
                tPractice("jantouFu.title"),
                practiceHref("jantou-fu"),
              )}
            >
              <ChallengePreview />
            </PracticePreview>
          </section>

          <section className="space-y-3">
            <GuideSubsectionTitle number={3}>
              {t("feature3Title")}
            </GuideSubsectionTitle>
            <GuideParagraph>{t("feature3Body1")}</GuideParagraph>
            <GuideParagraph>{t("feature3Body2")}</GuideParagraph>
            <PracticePreview
              caption={caption(
                "feature3Preview",
                tTenpai("title"),
                TENPAI_SCORE_PRACTICE_HREF,
              )}
            >
              <TenpaiScorePreview />
            </PracticePreview>
          </section>
        </div>
      </GuideSection>

      <GuideSection title={t("howToTitle")}>
        <GuideParagraph preLine>{t("howToBody")}</GuideParagraph>
        <GuideParagraph>{t("closing")}</GuideParagraph>
      </GuideSection>
    </div>
  );
}
