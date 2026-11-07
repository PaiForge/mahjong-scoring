import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { MachiFuGuide } from "./_components/machi-fu-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/machi-fu">) {
  await prepareRouteLocale(params, "/lessons/machi-fu");
  return createLearnMetadata("machi-fu");
}

export default async function LearnMachiFuPage({
  params,
}: PageProps<"/[locale]/lessons/machi-fu">) {
  await prepareRouteLocale(params, "/lessons/machi-fu");
  return (
    <LearnPageLayout slug="machi-fu">
      <MachiFuGuide />
    </LearnPageLayout>
  );
}
