import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { JantouFuGuide } from "./_components/jantou-fu-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/jantou-fu">) {
  const locale = await prepareRouteLocale(params, "/lessons/jantou-fu");
  return createLearnMetadata("jantou-fu", { locale });
}

export default async function LearnJantouFuPage({
  params,
}: PageProps<"/[locale]/lessons/jantou-fu">) {
  const locale = await prepareRouteLocale(params, "/lessons/jantou-fu");
  return (
    <LearnPageLayout slug="jantou-fu" locale={locale}>
      <JantouFuGuide />
    </LearnPageLayout>
  );
}
