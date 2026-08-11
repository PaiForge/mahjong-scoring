import { ManganKoTsumoScoreTable } from "./mangan-ko-tsumo-score-table";
import { ManganGuideLayout } from "../../_components/mangan-guide-layout";

/**
 * 子のツモ（満貫以上） — 満貫以上セクション第 3 章
 */
export function ManganKoTsumoGuide() {
  return (
    <ManganGuideLayout
      namespace="manganKoTsumo.learn"
      table={<ManganKoTsumoScoreTable />}
    />
  );
}
