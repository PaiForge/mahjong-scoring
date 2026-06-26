import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { YakuGuide } from "./_components/yaku-guide";

export function generateMetadata() {
  return createLearnMetadata("yaku.learn");
}

export default function LearnYakuPage() {
  return (
    <LearnPageLayout slug="yaku" namespace="yaku.learn">
      <YakuGuide />
    </LearnPageLayout>
  );
}
