import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { ManganKoTsumoGuide } from "./_components/mangan-ko-tsumo-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/mangan-ko-tsumo">) {
  const locale = await prepareRouteLocale(params, "/lessons/mangan-ko-tsumo");
  return createLearnMetadata("mangan-ko-tsumo", { locale });
}

export default async function LearnManganKoTsumoPage({
  params,
}: PageProps<"/[locale]/lessons/mangan-ko-tsumo">) {
  const locale = await prepareRouteLocale(params, "/lessons/mangan-ko-tsumo");
  return (
    <LearnPageLayout slug="mangan-ko-tsumo" locale={locale}>
      <ManganKoTsumoGuide />
    </LearnPageLayout>
  );
}
