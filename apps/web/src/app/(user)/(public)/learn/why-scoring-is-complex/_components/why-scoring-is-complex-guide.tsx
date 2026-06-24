import { getTranslations } from "next-intl/server";
import { SectionTitle } from "@/app/_components/section-title";
import { BlockMath, InlineMath } from "../../_components/math";

/**
 * 点数計算が複雑な理由 — 公式に基づく計算方法を例に解説するガイドコンポーネント
 */
export async function WhyScoringIsComplexGuide() {
  const t = await getTranslations("whyScoringIsComplex.learn");

  return (
    <div className="space-y-10">
      {/* 公式に基づけば計算自体は単純 */}
      <section className="space-y-4">
        <SectionTitle>{t("scoringIsSimpleTitle")}</SectionTitle>
        <p className="text-sm leading-relaxed text-surface-700">
          {t("scoringIsSimpleBody1")}
        </p>
        <p className="text-sm leading-relaxed text-surface-700">
          {t("scoringIsSimpleBody2")}
        </p>
        <p className="text-sm leading-relaxed text-surface-700">
          {t("scoringIsSimpleBody3")}
        </p>

        <BlockMath
          latex={String.raw`\text{符} \times 2^{(\text{翻数} + 2)} \times 4`}
        />

        <p className="text-sm leading-relaxed text-surface-700">
          {t("exampleIntro")}
        </p>

        <ol className="list-decimal space-y-1 pl-6 text-sm leading-relaxed text-surface-700">
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
          <li>{t("step4")}</li>
        </ol>

        <BlockMath
          latex={String.raw`\begin{aligned} & 30 \times 2^{(3+2)} \times 4 \\ &= 30 \times 32 \times 4 \\ &= 960 \times 4 \\ &= 3840 \xrightarrow{\text{切り上げ}} 3900 \end{aligned}`}
        />

        <p className="text-sm leading-relaxed text-surface-700">
          {t("calculatorNote")}
        </p>
        <p className="text-sm leading-relaxed text-surface-700">
          {t("memorizeNote")}
        </p>
        <p className="text-sm leading-relaxed text-surface-700">{t("kuku")}</p>
        <p className="text-sm leading-relaxed text-surface-700">
          {t("practiceNeeded")}
        </p>
      </section>
    </div>
  );
}
