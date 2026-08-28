/**
 * 門前のその他の手の点数計算
 *
 * @description
 * 点数の計算セクションの第3章。平和・七対子を除いた門前手を、
 * 「積み上げた符を10で切る」という1つの規則としてまとめる。
 * @flow
 * 教本の目次または前章（平和での点数計算）から遷移し、読了マークを付けて次章へ進む。
 */
import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { MenzenScoreGuide } from "./_components/menzen-score-guide";

export function generateMetadata() {
  return createLearnMetadata("menzen-score");
}

export default function LearnMenzenScorePage() {
  return (
    <LearnPageLayout slug="menzen-score" namespace="menzenScore.learn">
      <MenzenScoreGuide />
    </LearnPageLayout>
  );
}
