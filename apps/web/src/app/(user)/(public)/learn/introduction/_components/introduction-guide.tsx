import { getTranslations } from "next-intl/server";
import { SectionTitle } from "@/app/_components/section-title";
import { BlockMath, InlineMath } from "../../_components/math";

/**
 * はじめに — 点数計算の概要を解説するガイドコンポーネント
 */
export async function IntroductionGuide() {
  const t = await getTranslations("introduction.learn");

  return (
    <div className="space-y-10">
      {/* 麻雀の点数計算は複雑ではない */}
      <section>
        <SectionTitle>{t("scoringIsSimpleTitle")}</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-surface-700">
          {t("scoringIsSimpleBody1")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-surface-700">
          {t("scoringIsSimpleBody2")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-surface-700">
          {t("scoringIsSimpleBody3")}
        </p>

        <div className="mt-4">
          <BlockMath latex={String.raw`\text{符} \times 2^{(\text{翻数} + 2)} \times 4`} />
        </div>

        <p className="mt-2 text-sm leading-relaxed text-surface-700">
          {t("exampleIntro")}
        </p>

        <ol className="mt-3 list-decimal space-y-1 pl-6 text-sm leading-relaxed text-surface-700">
          <li>
            {t("step1Prefix")}
            <InlineMath latex={String.raw`\text{符}`} />
            {t("step1Mid")}
            <InlineMath latex={String.raw`\text{翻数}`} />
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
          <li>
            {t("step4")}
          </li>
        </ol>

        <div className="mt-4">
          <BlockMath
            latex={String.raw`\begin{aligned} & 30 \times 2^{(3+2)} \times 4 \\ &= 30 \times 32 \times 4 \\ &= 960 \times 4 \\ &= 3840 \xrightarrow{\text{切り上げ}} 3900 \end{aligned}`}
          />
        </div>

        <p className="mt-2 text-sm leading-relaxed text-surface-700">
          {t("calculatorNote")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-surface-700">
          {t("memorizeNote")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-surface-700">
          {t("kuku")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-surface-700">
          {t("practiceNeeded")}
        </p>
      </section>

      {/* このサイトの使い方 */}
      <section>
        <SectionTitle>{t("howToUseTitle")}</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-surface-700">
          {t("howToUseBody1")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-surface-700">
          {t("howToUseBody2")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-surface-700">
          {t("howToUseBody3")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-surface-700">
          {t("howToUseBody4")}
        </p>
      </section>
    </div>
  );
}
