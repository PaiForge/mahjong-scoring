import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { ManganKoRonGuide } from "./_components/mangan-ko-ron-guide";

export function generateMetadata() {
  return createLearnMetadata("mangan-ko-ron");
}

export default function LearnManganKoRonPage() {
  return (
    <LearnPageLayout slug="mangan-ko-ron">
      <ManganKoRonGuide />
    </LearnPageLayout>
  );
}
