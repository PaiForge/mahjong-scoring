import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { MentsuFuGuide } from "./_components/mentsu-fu-guide";

export function generateMetadata() {
  return createLearnMetadata("mentsuFu.learn");
}

export default function LearnMentsuFuPage() {
  return (
    <LearnPageLayout slug="mentsu-fu" namespace="mentsuFu.learn">
      <MentsuFuGuide />
    </LearnPageLayout>
  );
}
