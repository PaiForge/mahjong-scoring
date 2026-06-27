import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { ManganOyaRonGuide } from "./_components/mangan-oya-ron-guide";

export function generateMetadata() {
  return createLearnMetadata("manganOyaRon.learn");
}

export default function LearnManganOyaRonPage() {
  return (
    <LearnPageLayout slug="mangan-oya-ron" namespace="manganOyaRon.learn">
      <ManganOyaRonGuide />
    </LearnPageLayout>
  );
}
