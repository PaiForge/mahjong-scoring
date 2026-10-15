import type { ReactNode } from "react";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  TENPAI_SCORE_PRACTICE_HREF,
  practiceHref,
} from "@mahjong-scoring/features/routes";

import { SectionTitle } from "../../components/section-title";
import { ManganScoreCalculationHowToPlay } from "../../practice/boards/mangan-score-calculation/mangan-score-calculation-how-to-play";
import { TenpaiScorePreview } from "../../practice/endless/tenpai-score/tenpai-score-preview";
import { ChallengePreview } from "../components/challenge-preview";
import { InlineTextLink } from "../components/chapter-link";
import { GuideBody, GuideStack } from "../components/guide-section";
import { GuideParagraph, GuideSubsectionTitle } from "../components/guide-text";
import { PracticePreview } from "../components/practice-preview";

/**
 * このアプリについて — 「はじめに」セクション第 1 章（web の `AboutThisAppGuide`）
 *
 * 結論（アプリの特徴）から書き、特徴ごとに練習の実際の盤面を添える。
 * 作者のつまずきの話はコラム `why-scoring-is-hard-to-learn` に分けてある。
 */
export function AboutThisAppGuide() {
  const t = useTranslations("aboutThisApp.learn");
  const tPractice = useTranslations("practice.practices");
  const tTenpai = useTranslations("tenpaiScore");
  const router = useRouter();

  /** 図のキャプション。練習名は練習の辞書から引き、その練習へリンクする */
  const caption = (
    key: "feature1Preview" | "feature2Preview" | "feature3Preview",
    title: string,
    href: string,
  ): ReactNode =>
    t.rich(key, {
      title,
      link: (chunks) => (
        <InlineTextLink onPress={() => router.push(href)}>
          {chunks}
        </InlineTextLink>
      ),
    });

  return (
    <GuideBody>
      <GuideStack>
        <SectionTitle>{t("introTitle")}</SectionTitle>
        <GuideParagraph>{t("lead1")}</GuideParagraph>
        <GuideParagraph>{t("lead2")}</GuideParagraph>
      </GuideStack>

      <GuideStack>
        <SectionTitle>{t("featuresTitle")}</SectionTitle>
        <GuideStack gap={40}>
          <GuideStack>
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
          </GuideStack>

          <GuideStack>
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
          </GuideStack>

          <GuideStack>
            <GuideSubsectionTitle number={3}>
              {t("feature3Title")}
            </GuideSubsectionTitle>
            <GuideParagraph>{t("feature3Body1")}</GuideParagraph>
            <GuideParagraph>{t("feature3Body2")}</GuideParagraph>
            <GuideParagraph>{t("feature3Body3")}</GuideParagraph>
            <PracticePreview
              caption={caption(
                "feature3Preview",
                tTenpai("title"),
                TENPAI_SCORE_PRACTICE_HREF,
              )}
            >
              <TenpaiScorePreview />
            </PracticePreview>
          </GuideStack>
        </GuideStack>
      </GuideStack>

      <GuideStack>
        <SectionTitle>{t("howToTitle")}</SectionTitle>
        <GuideParagraph>{t("howToBody")}</GuideParagraph>
      </GuideStack>
    </GuideBody>
  );
}
