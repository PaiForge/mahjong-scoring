import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { MentsuFuGuide } from "./_components/mentsu-fu-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/mentsu-fu">) {
  await prepareRouteLocale(params, "/lessons/mentsu-fu");
  return createLearnMetadata("mentsu-fu");
}

export default async function LearnMentsuFuPage({
  params,
}: PageProps<"/[locale]/lessons/mentsu-fu">) {
  await prepareRouteLocale(params, "/lessons/mentsu-fu");
  return (
    <LearnPageLayout slug="mentsu-fu">
      <MentsuFuGuide />
    </LearnPageLayout>
  );
}
