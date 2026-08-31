import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";

import { GuideColumn } from "../../_components/guide-column";
import { GuideNote } from "../../_components/guide-note";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { BlockMath } from "../../_components/math";
import { FU_PAIRS } from "../_lib/fu-doubling-rows";
import { FuPairScoreTable } from "./fu-pair-score-table";
import { HanDoublingTable } from "./han-doubling-table";

/** 25符と50符の組。七対子とその倍の符で、この章の入口になる例 */
const CHIITOITSU_PAIR = { low: 25, high: 50 } as const;

/** 30符と60符の組。門前の面子手で最も多く出会う符 */
const MENZEN_PAIR = { low: 30, high: 60 } as const;

/** 20符と40符の組。平和ツモの副底20符とその倍 */
const PINFU_TSUMO_PAIR = { low: 20, high: 40 } as const;

/**
 * 符が倍になると1翻分 — 点数の計算セクション第5章
 */
export async function FuDoublingGuide() {
  const t = await getTranslations("fuDoubling.learn");

  return (
    <div className="space-y-10">
      {/* 翻が1つ上がると倍。切り上げのせいで表では2倍に見えないことまで含める */}
      <section className="space-y-4">
        <SectionTitle>{t("hanTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("hanBody1")}</GuideParagraph>

        <BlockMath
          latex={String.raw`\text{符} \times 2^{(\text{翻数} + 2)} \times 4`}
        />

        <GuideParagraph preLine>{t("hanBody2")}</GuideParagraph>

        <HanDoublingTable fu={30} role="ko" caption={t("hanTableCaption")} />

        <GuideParagraph preLine>{t("hanBody3")}</GuideParagraph>
      </section>

      {/* 本題。符を2倍にすることと指数を1つ増やすことが同じ積になる */}
      <section className="space-y-4">
        <SectionTitle>{t("fuTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("fuBody1")}</GuideParagraph>

        <BlockMath
          latex={String.raw`(2 \times \text{符}) \times 2^{(\text{翻数} + 2)} = \text{符} \times 2^{(\text{翻数} + 1 + 2)}`}
        />

        <GuideParagraph preLine>{t("fuBody2")}</GuideParagraph>

        <FuPairScoreTable
          pair={CHIITOITSU_PAIR}
          role="ko"
          winType="ron"
          caption={t("tableCaptionKoRon")}
        />
        <GuideNote>{t("linkedCellNote")}</GuideNote>

        <GuideParagraph preLine>{t("fuBody3")}</GuideParagraph>

        <FuPairScoreTable
          pair={MENZEN_PAIR}
          role="ko"
          winType="ron"
          caption={t("tableCaptionKoRon")}
        />

        <GuideParagraph preLine>{t("fuBody4")}</GuideParagraph>

        <FuPairScoreTable
          pair={PINFU_TSUMO_PAIR}
          role="ko"
          winType="tsumo"
          caption={t("tableCaptionKoTsumo")}
        />
        <GuideNote>{t("tsumoNote")}</GuideNote>

        <GuideParagraph preLine>{t("fuBody5")}</GuideParagraph>

        {/* 組は FU_PAIRS から描く。符の並びが変われば一覧も一緒に動く */}
        <ul className="list-disc space-y-1 pl-6 text-sm leading-relaxed text-surface-700">
          {FU_PAIRS.map((pair) => (
            <li key={pair.low}>
              {t("pairItem", { low: pair.low, high: pair.high })}
            </li>
          ))}
        </ul>
      </section>

      {/* 規則が使える範囲の上限 */}
      <section className="space-y-4">
        <SectionTitle>{t("manganTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("manganBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("manganBody2")}</GuideParagraph>
      </section>

      {/* コラム: 七対子の「50符1翻」はこの規則の実例そのもの */}
      <GuideColumn label={t("columnLabel")} title={t("columnTitle")}>
        <GuideParagraph>
          {t.rich("columnBody", { br: () => <br /> })}
        </GuideParagraph>
      </GuideColumn>
    </div>
  );
}
