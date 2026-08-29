/**
 * 平和以外の門前面子手の点数計算
 *
 * @description
 * 点数の計算セクションの第3章。特例（七対子・平和）を除いた門前の面子手を、
 * 「積み上げた符を10で切る」という1つの規則としてまとめる。
 * @flow
 * 教本の目次または前章（平和での点数計算）から遷移し、読了マークを付けて次章へ進む。
 */
import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { MenzenMentsuScoreGuide } from "./_components/menzen-mentsu-score-guide";

export function generateMetadata() {
  return createLearnMetadata("menzen-mentsu-score");
}

export default function LearnMenzenMentsuScorePage() {
  return (
    <LearnPageLayout
      slug="menzen-mentsu-score"
      namespace="menzenMentsuScore.learn"
    >
      <MenzenMentsuScoreGuide />
    </LearnPageLayout>
  );
}
