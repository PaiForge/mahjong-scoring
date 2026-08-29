/**
 * 鳴いた手の点数計算
 *
 * @description
 * 点数の計算セクションの第4章（最終章）。鳴いた手は必ず面子手になるため、
 * 門前の章との違いは「ロンに門前加符が付かない」1点だけに畳める。
 * @flow
 * 教本の目次または前章（平和以外の門前面子手の点数計算）から遷移し、読了マークを付ける。
 */
import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { FuroScoreGuide } from "./_components/furo-score-guide";

export function generateMetadata() {
  return createLearnMetadata("furo-score");
}

export default function LearnFuroScorePage() {
  return (
    <LearnPageLayout slug="furo-score" namespace="furoScore.learn">
      <FuroScoreGuide />
    </LearnPageLayout>
  );
}
