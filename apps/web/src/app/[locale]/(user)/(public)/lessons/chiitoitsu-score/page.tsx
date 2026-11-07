/**
 * 七対子での点数計算
 *
 * @description
 * 点数の計算セクションの第1章。符が常に25符に固定される七対子を、
 * 符を積み上げずに点数を出せる最初の形として覚える。
 * @flow
 * 教本の目次または前章（手牌全体の符）から遷移し、読了マークを付けて次章へ進む。
 */
import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { ChiitoitsuScoreGuide } from "./_components/chiitoitsu-score-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/chiitoitsu-score">) {
  const locale = await prepareRouteLocale(params, "/lessons/chiitoitsu-score");
  return createLearnMetadata("chiitoitsu-score", { locale });
}

export default async function LearnChiitoitsuScorePage({
  params,
}: PageProps<"/[locale]/lessons/chiitoitsu-score">) {
  const locale = await prepareRouteLocale(params, "/lessons/chiitoitsu-score");
  return (
    <LearnPageLayout slug="chiitoitsu-score" locale={locale}>
      <ChiitoitsuScoreGuide />
    </LearnPageLayout>
  );
}
