import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { WhyScoringIsComplexGuide } from "./_components/why-scoring-is-complex-guide";

export function generateMetadata() {
  return createLearnMetadata("why-scoring-is-complex");
}

export default function LearnWhyScoringIsComplexPage() {
  return (
    <LearnPageLayout slug="why-scoring-is-complex">
      <WhyScoringIsComplexGuide />
    </LearnPageLayout>
  );
}
