import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";

import { ChapterLink } from "../../_components/chapter-link";
import { GuideColumn } from "../../_components/guide-column";
import { GuideNote } from "../../_components/guide-note";
import { GuideOrderedList } from "../../_components/guide-ordered-list";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { BlockMath } from "../../_components/math";
import { RonHalvingDiagram } from "./ron-halving-diagram";
import { RonHalvingTable } from "./ron-halving-table";

/**
 * 例に使う符
 *
 * 30符は4翻でも満貫に届かないため、1翻から4翻まで頭打ちなしで並ぶ。
 * 1翻（1000 → 500 → 300）と4翻（7700 → 3900 → 2000）で切り上げが効くので、
 * 「端数が出ても手順は変わらない」がこの1枚で見える。
 */
const EXAMPLE_FU = 30;

/**
 * 図に使う翻数
 *
 * 30符4翻は 7700 → 3850 → 3900 → 1950 → 2000 と、2回とも端数が出る。
 * 手順を最初に見せる図なので、切り上げを省略できない組を選ぶ
 * （端数の無い組だと「割っただけ」に見えて、切り上げの位置が伝わらない）。
 */
const EXAMPLE_HAN = 4;

/**
 * 2つ目の例に使う符と翻
 *
 * 70符1翻は 2300 → 1150 → 1200 → 600。1回目の切り上げで100点足された値を
 * 出発点に2回目を割ることになる、この規則で最も疑わしく見える形にあたる。
 * それでも点数表の 600 / 1200 と一致するので、1つ目の例が30符という
 * 馴染みの符だったことによる「その符だからでは」という疑いを同時に潰す。
 */
const SECOND_EXAMPLE = { fu: 70, han: 1 } as const;

/**
 * ツモは子のロンを半分ずつにすれば出る — 点数記憶術セクション第2章
 */
export async function RonToTsumoGuide() {
  const t = await getTranslations("ronToTsumo.learn");

  return (
    <div className="space-y-10">
      {/* ツモの2段表記の導入と、ロンとの比。記憶の連鎖はここから始まる */}
      <section className="space-y-4">
        <SectionTitle>{t("divideTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("divideBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("divideBody2")}</GuideParagraph>

        <BlockMath
          latex={String.raw`\text{子のロン} : \text{親が出す} : \text{子が出す} = 4 : 2 : 1`}
        />

        <GuideNote>
          {t.rich("basePointsNote", {
            link: () => <ChapterLink slug="why-scoring-is-complex" />,
          })}
        </GuideNote>

        <GuideParagraph preLine>{t("divideBody3")}</GuideParagraph>
        <GuideParagraph preLine>{t("divideBody4")}</GuideParagraph>
      </section>

      {/* 本題。手順をそのまま図にする（表で一致を探させない） */}
      <section className="space-y-4">
        <SectionTitle>{t("stepsTitle")}</SectionTitle>
        <GuideParagraph>{t("stepsBody1")}</GuideParagraph>

        <GuideOrderedList>
          <li>{t("stepsItem1")}</li>
          <li>{t("stepsItem2")}</li>
        </GuideOrderedList>

        <RonHalvingDiagram fu={EXAMPLE_FU} han={EXAMPLE_HAN} />

        <GuideParagraph preLine>{t("stepsBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("stepsBody3")}</GuideParagraph>

        <RonHalvingTable fu={EXAMPLE_FU} caption={t("tableCaption")} />

        <GuideParagraph preLine>{t("stepsBody4")}</GuideParagraph>

        <RonHalvingDiagram fu={SECOND_EXAMPLE.fu} han={SECOND_EXAMPLE.han} />

        <GuideNote>{t("fuNote")}</GuideNote>
      </section>

      {/* 規則が成り立つ理由。割ると端数が縮み、掛けると広がる */}
      <section className="space-y-4">
        <SectionTitle>{t("whyTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("whyBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("whyBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("whyBody3")}</GuideParagraph>
      </section>

      {/* コラム: 同じ理屈で親ロンも出せそうに見える、という当然の期待に答える */}
      <GuideColumn label={t("columnLabel")} title={t("columnTitle")}>
        <GuideParagraph>
          {t.rich("columnBody", { br: () => <br /> })}
        </GuideParagraph>
      </GuideColumn>
    </div>
  );
}
