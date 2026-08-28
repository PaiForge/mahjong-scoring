/**
 * 七対子での点数計算
 *
 * @description
 * 点数の計算セクションの第2章。七対子の符は常に25符の1パターンで、
 * 翻数だけで点数が決まることを覚える。
 * @flow
 * 教本の目次または前章（平和での点数計算）から遷移し、読了マークを付けて次章へ進む。
 */
import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { ChitoisuScoreGuide } from "./_components/chitoisu-score-guide";

export function generateMetadata() {
  return createLearnMetadata("chitoisu-score");
}

export default function LearnChitoisuScorePage() {
  return (
    <LearnPageLayout slug="chitoisu-score" namespace="chitoisuScore.learn">
      <ChitoisuScoreGuide />
    </LearnPageLayout>
  );
}
