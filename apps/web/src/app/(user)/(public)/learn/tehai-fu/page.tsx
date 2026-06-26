import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { TehaiFuGuide } from "./_components/tehai-fu-guide";

export function generateMetadata() {
  return createLearnMetadata("tehaiFu.learn");
}

export default function LearnTehaiFuPage() {
  return (
    <LearnPageLayout slug="tehai-fu" namespace="tehaiFu.learn">
      <TehaiFuGuide />
    </LearnPageLayout>
  );
}
