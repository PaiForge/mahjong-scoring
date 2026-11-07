import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { AboutThisAppGuide } from "./_components/about-this-app-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/about-this-app">) {
  await prepareRouteLocale(params, "/lessons/about-this-app");
  return createLearnMetadata("about-this-app");
}

export default async function LearnAboutThisAppPage({
  params,
}: PageProps<"/[locale]/lessons/about-this-app">) {
  await prepareRouteLocale(params, "/lessons/about-this-app");
  return (
    <LearnPageLayout slug="about-this-app">
      <AboutThisAppGuide />
    </LearnPageLayout>
  );
}
