import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { ManganOyaTsumoGuide } from "./_components/mangan-oya-tsumo-guide";

export function generateMetadata() {
  return createLearnMetadata("manganOyaTsumo.learn");
}

export default function LearnManganOyaTsumoPage() {
  return (
    <LearnPageLayout slug="mangan-oya-tsumo" namespace="manganOyaTsumo.learn">
      <ManganOyaTsumoGuide />
    </LearnPageLayout>
  );
}
