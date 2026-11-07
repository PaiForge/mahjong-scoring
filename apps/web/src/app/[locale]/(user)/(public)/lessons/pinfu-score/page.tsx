/**
 * 平和での点数計算
 *
 * @description
 * 点数の計算セクションの第2章。頻出役であるピンフの点数を
 * 「ツモなら20符・ロンなら30符」の2パターンとして覚える。
 * @flow
 * 教本の目次または前章（七対子での点数計算）から遷移し、読了マークを付けて次章へ進む。
 */
import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { PinfuScoreGuide } from "./_components/pinfu-score-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/pinfu-score">) {
  const locale = await prepareRouteLocale(params, "/lessons/pinfu-score");
  return createLearnMetadata("pinfu-score", { locale });
}

export default async function LearnPinfuScorePage({
  params,
}: PageProps<"/[locale]/lessons/pinfu-score">) {
  const locale = await prepareRouteLocale(params, "/lessons/pinfu-score");
  return (
    <LearnPageLayout slug="pinfu-score" locale={locale}>
      <PinfuScoreGuide />
    </LearnPageLayout>
  );
}
