import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { MentsuFuGuide } from "./_components/mentsu-fu-guide";

export function generateMetadata() {
  return createLearnMetadata("mentsu-fu");
}

export default function LearnMentsuFuPage() {
  return (
    <LearnPageLayout slug="mentsu-fu">
      <MentsuFuGuide />
    </LearnPageLayout>
  );
}
