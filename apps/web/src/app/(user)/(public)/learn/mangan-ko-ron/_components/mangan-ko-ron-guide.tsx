import { ManganScoreTable } from "../../_components/mangan-score-table";
import { ManganGuideLayout } from "../../_components/mangan-guide-layout";

/**
 * 子のロン（満貫以上） — 満貫以上セクション第 1 章
 */
export function ManganKoRonGuide() {
  return (
    <ManganGuideLayout
      namespace="manganKoRon.learn"
      table={<ManganScoreTable role="ko" />}
    />
  );
}
