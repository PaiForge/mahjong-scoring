import { getTranslations } from "next-intl/server";
import { HIGH_SCORES } from "@mahjong-scoring/core";

import { SectionTitle } from "@/app/(user)/_components/section-title";

import { GuideParagraph } from "../../_components/guide-paragraph";
import { ManganGuideLayout } from "../../_components/mangan-guide-layout";
import { ManganOyaTsumoScoreTable } from "./mangan-oya-tsumo-score-table";
import { OyaAllDiagram } from "./oya-all-diagram";

/**
 * 図に使う区分
 *
 * 子のツモの章と同じ満貫を選ぶ。2章の図を並べて見比べたときに、鎖の長さの
 * 違い（2手と1手）だけが目に入るようにする。
 */
const DIAGRAM_TIER = "mangan";

/**
 * 親のツモ（満貫以上） — 満貫以上セクション第 4 章
 *
 * 共通の節（表とその読み方）に、導出の節を足す。子のツモの章と対になる位置に
 * 同じ形の図を置くが、本文は 1 段落しか持たない。「ロンから出せるので覚え直さ
 * なくてよい」という話は子のツモの章で済んでいて、ここで繰り返すとくどくなる。
 * この章が足すのは「今度は 3 で割る 1 回で済む」という差だけ。
 */
export async function ManganOyaTsumoGuide() {
  const t = await getTranslations("manganOyaTsumo.learn");
  const tier = HIGH_SCORES.find((row) => row.nameKey === DIAGRAM_TIER);
  if (!tier) throw new Error(`HIGH_SCORES に ${DIAGRAM_TIER} の区分がない`);

  return (
    <ManganGuideLayout
      namespace="manganOyaTsumo.learn"
      table={<ManganOyaTsumoScoreTable />}
    >
      <section className="space-y-4">
        <SectionTitle>{t("divisionTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("divisionBody")}</GuideParagraph>

        <OyaAllDiagram
          caption={t("divisionDiagramCaption")}
          ron={tier.ronOya}
          payment={tier.tsumoOya}
        />
      </section>
    </ManganGuideLayout>
  );
}
