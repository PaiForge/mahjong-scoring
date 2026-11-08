import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { MentsuFuGuide } from "./_components/mentsu-fu-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/mentsu-fu">) {
  const locale = await prepareRouteLocale(params, "/lessons/mentsu-fu");
  return createLearnMetadata("mentsu-fu", { locale });
}

export default async function LearnMentsuFuPage({
  params,
}: PageProps<"/[locale]/lessons/mentsu-fu">) {
  const locale = await prepareRouteLocale(params, "/lessons/mentsu-fu");
  return (
    <LearnPageLayout slug="mentsu-fu" locale={locale}>
      <MentsuFuGuide />
    </LearnPageLayout>
  );
}
