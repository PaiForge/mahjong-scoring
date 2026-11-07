import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { WhyScoringIsComplexGuide } from "./_components/why-scoring-is-complex-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/why-scoring-is-complex">) {
  await prepareRouteLocale(params, "/lessons/why-scoring-is-complex");
  return createLearnMetadata("why-scoring-is-complex");
}

export default async function LearnWhyScoringIsComplexPage({
  params,
}: PageProps<"/[locale]/lessons/why-scoring-is-complex">) {
  await prepareRouteLocale(params, "/lessons/why-scoring-is-complex");
  return (
    <LearnPageLayout slug="why-scoring-is-complex">
      <WhyScoringIsComplexGuide />
    </LearnPageLayout>
  );
}
