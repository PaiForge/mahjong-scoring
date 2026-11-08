import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import { ManganScoreCalculationHowToPlay } from "@/app/[locale]/(user)/(public)/practice/mangan-score-calculation/_components/mangan-score-calculation-how-to-play";
import { TenpaiScorePreview } from "@/app/[locale]/(user)/(public)/practice/tenpai-score/_components/tenpai-score-preview";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import {
  TENPAI_SCORE_PRACTICE_HREF,
  practiceHref,
} from "@mahjong-scoring/features/routes";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { GuideSubsectionTitle } from "../../_components/guide-subsection-title";
import { ChallengePreview } from "./challenge-preview";
import { PracticePreview } from "./practice-preview";

/**
 * このアプリについて — 「はじめに」セクション第 1 章
 *
 * 結論（アプリの特徴）から書く。特徴は 3 つで、どれも「点数計算でつまずき
 * やすいところ」への手当てになっている。その対応が先に読めるよう、各特徴の
 * 最初の段落でつまずきを、次の段落で手当てを書き、練習の実際の画面を添える。
 * つまずきそのものの話（作者の体験）はコラム `why-scoring-is-hard-to-learn` に
 * 分けてある。
 *
 * キャプションの練習へのリンクは `resolveNavTargetFor` で今の言語の href を張る。
 * 紹介する練習（満貫以上の点数計算・雀頭の符計算・聴牌形の点数計算）は英語でも
 * 公開しているので、英語の章からは英語の練習へ移る。未公開の行き先を指すことに
 * なれば、素の `<a hrefLang="ja">` と「日本語のみ」の印に変わる。
 *
 * @param locale - 章を描く言語（ページの `prepareRouteLocale` の戻り値）
 */
export async function AboutThisAppGuide({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const [t, tPractice, tTenpai, tNav] = await Promise.all([
    getTranslations("aboutThisApp.learn"),
    getTranslations("practice.practices"),
    getTranslations("tenpaiScore"),
    getTranslations("nav"),
  ]);

  /** プレビューのキャプション。練習名は練習の辞書から引き、その練習へリンクする */
  const caption = (
    key: "feature1Preview" | "feature2Preview" | "feature3Preview",
    title: string,
    href: string,
  ): ReactNode => {
    const target = resolveNavTargetFor(href, locale);
    return t.rich(key, {
      title,
      link: (chunks) => (
        <LocaleNavLink
          navTarget={target}
          linkKind="plain"
          className={TEXT_LINK_CLASSES}
        >
          {chunks}
          {target.crossLocale && (
            <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
          )}
        </LocaleNavLink>
      ),
    });
  };

  return (
    <div className="space-y-10">
      <GuideSection title={t("introTitle")}>
        <GuideParagraph preLine>{t("lead1")}</GuideParagraph>
        <GuideParagraph preLine>{t("lead2")}</GuideParagraph>
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
            <GuideParagraph preLine>{t("feature2Body1")}</GuideParagraph>
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
            <GuideParagraph preLine>{t("feature3Body1")}</GuideParagraph>
            <GuideParagraph>{t("feature3Body2")}</GuideParagraph>
            <GuideParagraph preLine>{t("feature3Body3")}</GuideParagraph>
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
      </GuideSection>
    </div>
  );
}
