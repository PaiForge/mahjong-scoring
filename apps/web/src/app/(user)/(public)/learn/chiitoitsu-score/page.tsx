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
import { ChiitoitsuScoreGuide } from "./_components/chiitoitsu-score-guide";

export function generateMetadata() {
  return createLearnMetadata("chiitoitsu-score");
}

export default function LearnChiitoitsuScorePage() {
  return (
    <LearnPageLayout slug="chiitoitsu-score" namespace="chiitoitsuScore.learn">
      <ChiitoitsuScoreGuide />
    </LearnPageLayout>
  );
}
