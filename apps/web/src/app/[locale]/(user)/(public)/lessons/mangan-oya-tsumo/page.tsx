import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { ManganOyaTsumoGuide } from "./_components/mangan-oya-tsumo-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/mangan-oya-tsumo">) {
  const locale = await prepareRouteLocale(params, "/lessons/mangan-oya-tsumo");
  return createLearnMetadata("mangan-oya-tsumo", { locale });
}

export default async function LearnManganOyaTsumoPage({
  params,
}: PageProps<"/[locale]/lessons/mangan-oya-tsumo">) {
  const locale = await prepareRouteLocale(params, "/lessons/mangan-oya-tsumo");
  return (
    <LearnPageLayout slug="mangan-oya-tsumo" locale={locale}>
      <ManganOyaTsumoGuide />
    </LearnPageLayout>
  );
}
