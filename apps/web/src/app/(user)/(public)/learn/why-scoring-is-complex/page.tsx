import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { WhyScoringIsComplexGuide } from "./_components/why-scoring-is-complex-guide";

/** KaTeX CSS（数式レンダリング用） */
const KATEX_CSS_HREF =
  "https://cdn.jsdelivr.net/npm/katex@0.16.44/dist/katex.min.css";

export function generateMetadata() {
  return createLearnMetadata("whyScoringIsComplex.learn");
}

export default function LearnWhyScoringIsComplexPage() {
  return (
    <>
      <link rel="stylesheet" href={KATEX_CSS_HREF} />
      <LearnPageLayout
        slug="why-scoring-is-complex"
        namespace="whyScoringIsComplex.learn"
      >
        <WhyScoringIsComplexGuide />
      </LearnPageLayout>
    </>
  );
}
