import { getTranslations } from "next-intl/server";
import { HIGH_SCORES } from "@mahjong-scoring/core";

import { SectionTitle } from "@/app/(user)/_components/section-title";

import { ChapterLink } from "../../_components/chapter-link";
import { GuideNote } from "../../_components/guide-note";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { HalvingDiagram } from "../../_components/halving-diagram";
import { ManganGuideLayout } from "../../_components/mangan-guide-layout";
import { ManganKoTsumoScoreTable } from "./mangan-ko-tsumo-score-table";

/**
 * 図に使う区分
 *
 * 手順を最初に見せる図なので、最も基本の満貫を選ぶ。8000 → 4000 → 2000 と
 * 端数が一度も出ないため、鎖そのものだけが目に入る。
 */
const DIAGRAM_TIER = "mangan";

/**
 * 子のツモ（満貫以上） — 満貫以上セクション第 2 章
 *
 * 共通の節（表とその読み方）に、この章だけの導出の節を足す。表は「合計を
 * 子・子・親で分け合う」という分配の見方で、続く節は同じ数字を「ロンを2回
 * 半分にする」という手順の見方に置き換える。分配だけだと 2000 と 4000 は
 * 覚える対象のままだが、手順まで見せると子のロンから出せるようになる。
 */
export async function ManganKoTsumoGuide() {
  const t = await getTranslations("manganKoTsumo.learn");
  const tier = HIGH_SCORES.find((row) => row.nameKey === DIAGRAM_TIER);
  if (!tier) throw new Error(`HIGH_SCORES に ${DIAGRAM_TIER} の区分がない`);

  return (
    <ManganGuideLayout
      namespace="manganKoTsumo.learn"
      table={<ManganKoTsumoScoreTable />}
    >
      <section className="space-y-4">
        <SectionTitle>{t("halvingTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("halvingBody1")}</GuideParagraph>

        <HalvingDiagram
          caption={t("halvingDiagramCaption")}
          ron={tier.ronKo}
          payment={tier.tsumoKo}
        />

        <GuideParagraph preLine>{t("halvingBody2")}</GuideParagraph>

        <GuideNote>
          {t.rich("halvingNote", {
            link: () => <ChapterLink slug="ron-to-tsumo" />,
          })}
        </GuideNote>
      </section>
    </ManganGuideLayout>
  );
}
