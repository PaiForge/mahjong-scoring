/**
 * ツモは子のロンを半分ずつにすれば出る
 *
 * @description
 * 点数記憶術セクションの第3章。子のロンを2で割って切り上げると親が出す額に、
 * それをもう一度2で割って切り上げると子が出す額になることを示し、ツモの列を
 * ロンとは別に覚える必要をなくす。切り上げがあっても崩れないのは割る向きだけで、
 * 掛ける向き（親ロン＝子ロンの1.5倍）は崩れることまで含めて扱う。
 * @flow
 * 教本の目次または前章（ツモの表は子ツモだけ覚えればいい）から遷移し、
 * 読了マークを付けて子ツモに絞った点数表早引きの練習へ進む。
 */
import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { RonToTsumoGuide } from "./_components/ron-to-tsumo-guide";

export function generateMetadata() {
  return createLearnMetadata("ron-to-tsumo");
}

export default function LearnRonToTsumoPage() {
  return (
    <LearnPageLayout slug="ron-to-tsumo">
      <RonToTsumoGuide />
    </LearnPageLayout>
  );
}
