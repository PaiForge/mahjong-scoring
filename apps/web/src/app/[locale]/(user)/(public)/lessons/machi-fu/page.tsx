import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { MachiFuGuide } from "./_components/machi-fu-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/machi-fu">) {
  const locale = await prepareRouteLocale(params, "/lessons/machi-fu");
  return createLearnMetadata("machi-fu", { locale });
}

export default async function LearnMachiFuPage({
  params,
}: PageProps<"/[locale]/lessons/machi-fu">) {
  const locale = await prepareRouteLocale(params, "/lessons/machi-fu");
  return (
    <LearnPageLayout slug="machi-fu" locale={locale}>
      <MachiFuGuide />
    </LearnPageLayout>
  );
}
