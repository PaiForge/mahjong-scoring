import { getTranslations } from "next-intl/server";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { GuideSection } from "../../_components/guide-section";
import { BlockMath, InlineMath } from "../../_components/math";
import { HighlightPanel } from "@/app/[locale]/(user)/_components/highlight-panel";

/**
 * 点数計算が複雑な理由 — 公式に基づく計算方法を例に解説するガイドコンポーネント
 *
 * 数式の中の語（`\text{…}`）は章の辞書の `formula.*` から引く。英語の章に
 * 漢字を残さないため。訳語は `String.raw` のテンプレートにそのまま埋めるので、
 * LaTeX の特殊文字（`\ { } $ & # ^ _ % ~`）を含まない前提（含めると数式が
 * 壊れる。語は「符」「翻数」のような名詞だけにする）。
 */
export async function WhyScoringIsComplexGuide() {
  const t = await getTranslations("whyScoringIsComplex.learn");
  const fu = t("formula.fu");
  const han = t("formula.han");
  const roundUp = t("formula.roundUp");

  return (
    <div className="space-y-10">
      {/* 公式に基づけば計算自体は単純 */}
      <GuideSection title={t("scoringIsSimpleTitle")}>
        <GuideParagraph preLine>{t("scoringIsSimpleBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("scoringIsSimpleBody2")}</GuideParagraph>

        <BlockMath
          latex={String.raw`\text{${fu}} \times 2^{(\text{${han}} + 2)} \times 4`}
        />

        <GuideParagraph preLine>{t("exampleIntro")}</GuideParagraph>

        {/* 計算手順 */}
        <HighlightPanel>
          <ol className="list-decimal space-y-1 pl-6 text-sm leading-relaxed text-surface-700">
            <li>
              {t("step1Prefix")}
              <InlineMath latex={String.raw`\text{${fu}}`} />
              {t("step1Mid")}
              <InlineMath latex={String.raw`\text{${han}}`} />
              {t("step1Suffix")}
            </li>
            <li>
              {t("step2Prefix")}
              <InlineMath latex={String.raw`2^{(3+2)} = 2^5 = 32`} />
              {t("step2Suffix")}
            </li>
            <li>
              {t("step3Prefix")}
              <InlineMath latex={String.raw`30 \times 32 \times 4`} />
              {t("step3Suffix")}
            </li>
            <li>{t("step4")}</li>
          </ol>

          <BlockMath
            latex={String.raw`\begin{aligned} & 30 \times 2^{(3+2)} \times 4 \\ &= 30 \times 32 \times 4 \\ &= 960 \times 4 \\ &= 3840 \xrightarrow{\text{${roundUp}}} 3900 \end{aligned}`}
          />
        </HighlightPanel>

        <GuideParagraph preLine>{t("calculatorNote")}</GuideParagraph>
        <GuideParagraph preLine>{t("memorizeNote")}</GuideParagraph>
        <GuideParagraph preLine>{t("kuku")}</GuideParagraph>
        <GuideParagraph preLine>{t("practiceNeeded")}</GuideParagraph>
      </GuideSection>
    </div>
  );
}
