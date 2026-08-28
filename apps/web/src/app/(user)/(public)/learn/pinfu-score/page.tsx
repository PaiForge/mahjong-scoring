/**
 * 平和での点数計算
 *
 * @description
 * 点数の計算セクションの第1章。頻出役であるピンフの点数を
 * 「ツモなら20符・ロンなら30符」の2パターンとして覚える。
 * @flow
 * 教本の目次または前章（手牌全体の符）から遷移し、読了マークを付けて次章へ進む。
 */
import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { PinfuScoreGuide } from "./_components/pinfu-score-guide";

export function generateMetadata() {
  return createLearnMetadata("pinfu-score");
}

export default function LearnPinfuScorePage() {
  return (
    <LearnPageLayout slug="pinfu-score" namespace="pinfuScore.learn">
      <PinfuScoreGuide />
    </LearnPageLayout>
  );
}
