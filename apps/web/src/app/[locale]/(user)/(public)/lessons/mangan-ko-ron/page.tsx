import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { ManganKoRonGuide } from "./_components/mangan-ko-ron-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/mangan-ko-ron">) {
  await prepareRouteLocale(params, "/lessons/mangan-ko-ron");
  return createLearnMetadata("mangan-ko-ron");
}

export default async function LearnManganKoRonPage({
  params,
}: PageProps<"/[locale]/lessons/mangan-ko-ron">) {
  await prepareRouteLocale(params, "/lessons/mangan-ko-ron");
  return (
    <LearnPageLayout slug="mangan-ko-ron">
      <ManganKoRonGuide />
    </LearnPageLayout>
  );
}
