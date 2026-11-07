import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { ManganOyaRonGuide } from "./_components/mangan-oya-ron-guide";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons/mangan-oya-ron">) {
  await prepareRouteLocale(params, "/lessons/mangan-oya-ron");
  return createLearnMetadata("mangan-oya-ron");
}

export default async function LearnManganOyaRonPage({
  params,
}: PageProps<"/[locale]/lessons/mangan-oya-ron">) {
  await prepareRouteLocale(params, "/lessons/mangan-oya-ron");
  return (
    <LearnPageLayout slug="mangan-oya-ron">
      <ManganOyaRonGuide />
    </LearnPageLayout>
  );
}
