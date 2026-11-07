import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { YakuGuide } from "./_components/yaku-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/yaku">) {
  const locale = await prepareRouteLocale(params, "/lessons/yaku");
  return createLearnMetadata("yaku", { locale });
}

export default async function LearnYakuPage({
  params,
}: PageProps<"/[locale]/lessons/yaku">) {
  const locale = await prepareRouteLocale(params, "/lessons/yaku");
  return (
    <LearnPageLayout slug="yaku" locale={locale}>
      <YakuGuide />
    </LearnPageLayout>
  );
}
