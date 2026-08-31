import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";

import { GuideColumn } from "../../_components/guide-column";
import { GuideParagraph } from "../../_components/guide-paragraph";
import { TsumoCarryoverDiagram } from "./tsumo-carryover-diagram";
import { TsumoSplitTable } from "./tsumo-split-table";

/**
 * 例に使う符
 *
 * 30符は4翻でも満貫に届かないため、1翻から4翻まで頭打ちなしで並ぶ。
 * 切り上げで2倍が崩れる行（1翻の 300 と 500）も含むので、章が言いたい
 * 「切り上げ前は2倍・表では必ずしもそうならない」がこの1枚で両方見える。
 */
const EXAMPLE_FU = 30;

/**
 * 図に使う翻数
 *
 * 30符3翻は 1000 / 2000 と 2000 オールで、どちらも切り上げの端数を含まない。
 * 「下段をそのまま持っていく」ことだけを見せたい図なので、端数で目が
 * 止まらない組を選ぶ。
 */
const EXAMPLE_HAN = 3;

/**
 * ツモの表は子ツモだけ覚えればいい — 点数記憶術セクション第2章
 */
export async function TsumoPaymentsGuide() {
  const t = await getTranslations("tsumoPayments.learn");

  return (
    <div className="space-y-10">
      {/* 子ツモの2つの数字の関係。切り上げで崩れることまで正直に書く */}
      <section className="space-y-4">
        <SectionTitle>{t("splitTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("splitBody1")}</GuideParagraph>
        <GuideParagraph preLine>{t("splitBody2")}</GuideParagraph>

        <TsumoSplitTable fu={EXAMPLE_FU} caption={t("splitTableCaption")} />

        <GuideParagraph preLine>{t("splitBody3")}</GuideParagraph>
        <GuideParagraph preLine>{t("splitBody4")}</GuideParagraph>
      </section>

      {/* 本題。結論をそのまま図にする（表で一致を探させない） */}
      <section className="space-y-4">
        <SectionTitle>{t("roleTitle")}</SectionTitle>
        <GuideParagraph preLine>{t("roleBody1")}</GuideParagraph>

        <TsumoCarryoverDiagram fu={EXAMPLE_FU} han={EXAMPLE_HAN} />

        <GuideParagraph preLine>{t("roleBody2")}</GuideParagraph>
        <GuideParagraph preLine>{t("roleBody3")}</GuideParagraph>
      </section>

      {/* コラム: 3口を足すとロンになるのか、という当然の疑問に答える */}
      <GuideColumn label={t("columnLabel")} title={t("columnTitle")}>
        <GuideParagraph>
          {t.rich("columnBody", { br: () => <br /> })}
        </GuideParagraph>
      </GuideColumn>
    </div>
  );
}
