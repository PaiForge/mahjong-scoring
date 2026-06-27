import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { ManganKoRonGuide } from "./_components/mangan-ko-ron-guide";

export function generateMetadata() {
  return createLearnMetadata("manganKoRon.learn");
}

export default function LearnManganKoRonPage() {
  return (
    <LearnPageLayout slug="mangan-ko-ron" namespace="manganKoRon.learn">
      <ManganKoRonGuide />
    </LearnPageLayout>
  );
}
