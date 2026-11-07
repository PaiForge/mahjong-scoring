/**
 * 平和以外の門前面子手の点数計算
 *
 * @description
 * 点数の計算セクションの第3章。特例（七対子・平和）を除いた門前の面子手の符を、
 * 「副底・和了り方の符・積み上げた符を足して切り上げる」数え方で出し、
 * どこでテンパネするかの典型をロンとツモに分けて見せる。
 *
 * 以前は「ツモは30符に積み上げた符を10で切り捨てた分を、ロンは切り上げた分を
 * 足す」という覚え方を教えていたが、ツモを30符起点にずらすのは数え方の
 * 1流派でしかないため、誰の数え方でも成り立つ「足して切り上げる」に寄せた。
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
    <LearnPageLayout slug="menzen-mentsu-score">
      <MenzenMentsuScoreGuide />
    </LearnPageLayout>
  );
}
