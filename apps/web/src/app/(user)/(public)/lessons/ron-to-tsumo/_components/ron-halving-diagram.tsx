import { getTranslations } from "next-intl/server";
import { calculateKoScore, type Fu } from "@mahjong-scoring/core";

import { HalvingDiagram } from "../../_components/halving-diagram";

interface RonHalvingDiagramProps {
  readonly fu: Fu;
  readonly han: number;
}

/**
 * 符・翻の1枠について、子のロンから子ツモを導く図
 * 半分ずつの図（満貫未満）
 *
 * 絵そのものは満貫以上の章と共有する（{@link HalvingDiagram}）。この章が足すのは
 * 「どの枠の話か」だけで、出発点のロンと答え合わせの子ツモは点数表と同じ
 * `calculateKoScore` から取る。
 */
export async function RonHalvingDiagram({ fu, han }: RonHalvingDiagramProps) {
  const t = await getTranslations("ronToTsumo.learn");
  const { ron, tsumo } = calculateKoScore(han, fu);

  return (
    <HalvingDiagram
      caption={t("diagramCaption", { fu, han })}
      ron={ron}
      payment={tsumo}
    />
  );
}
