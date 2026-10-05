/**
 * 親ツモの列は覚えなくていい
 *
 * @description
 * 点数記憶術セクションの第3章。親ツモのオール額が子ツモの親払い額と例外なく
 * 一致することを示し、親ツモの表を独立に覚える必要をなくす。
 *
 * 記憶の連鎖（子のロン → 子ツモ → 親ツモ）の終点にあたる。子ツモの2つの数字が
 * 基本符の1倍・2倍であることは前章が済ませているため、この章はそれを受け取る
 * ところから始める。
 * @flow
 * 教本の目次または前章（ツモは子のロンを半分ずつにすれば出る）から遷移し、
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
