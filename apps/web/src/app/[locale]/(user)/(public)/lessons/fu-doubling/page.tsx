/**
 * 符が倍になるのは1翻上がるのと同じ
 *
 * @description
 * 点数記憶術セクションの第1章。符を2倍にすることと翻を1つ上げることが
 * 点数のうえで同じ意味を持つことを示し、点数表で覚える行を減らす。
 *
 * 点数計算基礎のセクションが「符から点数を出せるようになる」章の集まりなのに
 * 対し、こちらは「覚える量を減らす」章の集まり。読者にとって目的が別なので
 * セクションを分けている。
 * @flow
 * 教本の目次または前章（鳴いた手の点数計算）から遷移し、読了マークを付けて
 * 点数表早引きの練習へ進む。
 */
import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { FuDoublingGuide } from "./_components/fu-doubling-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/fu-doubling">) {
  const locale = await prepareRouteLocale(params, "/lessons/fu-doubling");
  return createLearnMetadata("fu-doubling", { locale });
}

export default async function LearnFuDoublingPage({
  params,
}: PageProps<"/[locale]/lessons/fu-doubling">) {
  const locale = await prepareRouteLocale(params, "/lessons/fu-doubling");
  return (
    <LearnPageLayout slug="fu-doubling" locale={locale}>
      <FuDoublingGuide />
    </LearnPageLayout>
  );
}
