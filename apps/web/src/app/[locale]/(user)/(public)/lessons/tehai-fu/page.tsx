import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { TehaiFuGuide } from "./_components/tehai-fu-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/tehai-fu">) {
  await prepareRouteLocale(params, "/lessons/tehai-fu");
  return createLearnMetadata("tehai-fu");
}

export default async function LearnTehaiFuPage({
  params,
}: PageProps<"/[locale]/lessons/tehai-fu">) {
  await prepareRouteLocale(params, "/lessons/tehai-fu");
  return (
    <LearnPageLayout slug="tehai-fu">
      <TehaiFuGuide />
    </LearnPageLayout>
  );
}
