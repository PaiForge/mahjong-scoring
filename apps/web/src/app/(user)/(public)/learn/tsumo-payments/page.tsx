/**
 * ツモの表は子ツモだけ覚えればいい
 *
 * @description
 * 点数記憶術セクションの第2章。子ツモの2つの数字が基本符の1倍・2倍である
 * ことと、親ツモのオール額が子ツモの親払い額と例外なく一致することを示し、
 * 親ツモの表を独立に覚える必要をなくす。
 * @flow
 * 教本の目次または前章（符が倍になるのは1翻上がるのと同じ）から遷移し、
 * 読了マークを付けてツモに絞った点数表早引きの練習へ進む。
 */
import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { TsumoPaymentsGuide } from "./_components/tsumo-payments-guide";

export function generateMetadata() {
  return createLearnMetadata("tsumo-payments");
}

export default function LearnTsumoPaymentsPage() {
  return (
    <LearnPageLayout slug="tsumo-payments">
      <TsumoPaymentsGuide />
    </LearnPageLayout>
  );
}
