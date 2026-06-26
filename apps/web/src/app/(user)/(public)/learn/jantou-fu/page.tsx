import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { JantouFuGuide } from "./_components/jantou-fu-guide";

export function generateMetadata() {
  return createLearnMetadata("jantouFu.learn");
}

export default function LearnJantouFuPage() {
  return (
    <LearnPageLayout slug="jantou-fu" namespace="jantouFu.learn">
      <JantouFuGuide />
    </LearnPageLayout>
  );
}
