import { ManganOyaTsumoScoreTable } from "./mangan-oya-tsumo-score-table";
import { ManganGuideLayout } from "../../_components/mangan-guide-layout";

/**
 * 親のツモ（満貫以上） — 満貫以上セクション第 4 章
 */
export function ManganOyaTsumoGuide() {
  return (
    <ManganGuideLayout
      namespace="manganOyaTsumo.learn"
      table={<ManganOyaTsumoScoreTable />}
    />
  );
}
