import { ManganScoreTable } from "../../_components/mangan-score-table";
import { ManganGuideLayout } from "../../_components/mangan-guide-layout";

/**
 * 親のロン（満貫以上） — 満貫以上セクション第 2 章
 */
export function ManganOyaRonGuide() {
  return (
    <ManganGuideLayout
      namespace="manganOyaRon.learn"
      table={<ManganScoreTable role="oya" />}
    />
  );
}
