/**
 * 親ロンでの効率的な点数の覚え方
 *
 * @description
 * 点数記憶術セクションの第4章。親の点数は子の1.5倍という規則を示したうえで、
 * 満貫未満の親ロンでは100点単位の切り上げのせいで1.5倍にならないマスが
 * 14個あることを表の上で示し、そのマスだけを覚えれば親ロンの表を丸ごと
 * 覚えずに済むようにする。
 *
 * ずれる向きは上下どちらもあり、子の点数から言い当てる規則が無いため、
 * 規則で導かせずに「覚えるマス」として見せる。
 * @flow
 * 教本の目次または前章（親ツモの列は覚えなくていい）から遷移し、完了を
 * 付けて親・満貫未満の点数表早引きの練習へ進む。
 */
import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { OyaRonScoresGuide } from "./_components/oya-ron-scores-guide";

export function generateMetadata() {
  return createLearnMetadata("oya-ron-scores");
}

export default function LearnOyaRonScoresPage() {
  return (
    <LearnPageLayout slug="oya-ron-scores">
      <OyaRonScoresGuide />
    </LearnPageLayout>
  );
}
