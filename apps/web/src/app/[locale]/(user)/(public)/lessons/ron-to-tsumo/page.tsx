/**
 * ツモは子のロンを半分ずつにすれば出る
 *
 * @description
 * 点数記憶術セクションの第2章。子のロンを2で割って切り上げると親が出す額に、
 * それをもう一度2で割って切り上げると子が出す額になることを示し、ツモの列を
 * ロンとは別に覚える必要をなくす。切り上げがあっても崩れないのは割る向きだけで、
 * 掛ける向き（親ロン＝子ロンの1.5倍）は崩れることまで含めて扱う。
 *
 * 記憶の連鎖（子のロン → 子ツモ → 親ツモ）の2つ目にあたる。次章が受け取るのは
 * ここで出した子ツモの下段なので、この章は暗記の起点である子のロンだけを
 * 前提に読めること。
 * @flow
 * 教本の目次または前章（符が倍になるのは1翻上がるのと同じ）から遷移し、
 * 読了マークを付けて子ツモに絞った点数表早引きの練習へ進む。
 */
import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { RonToTsumoGuide } from "./_components/ron-to-tsumo-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/ron-to-tsumo">) {
  const locale = await prepareRouteLocale(params, "/lessons/ron-to-tsumo");
  return createLearnMetadata("ron-to-tsumo", { locale });
}

export default async function LearnRonToTsumoPage({
  params,
}: PageProps<"/[locale]/lessons/ron-to-tsumo">) {
  const locale = await prepareRouteLocale(params, "/lessons/ron-to-tsumo");
  return (
    <LearnPageLayout slug="ron-to-tsumo" locale={locale}>
      <RonToTsumoGuide />
    </LearnPageLayout>
  );
}
