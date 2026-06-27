import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { ManganKoTsumoGuide } from "./_components/mangan-ko-tsumo-guide";

export function generateMetadata() {
  return createLearnMetadata("manganKoTsumo.learn");
}

export default function LearnManganKoTsumoPage() {
  return (
    <LearnPageLayout slug="mangan-ko-tsumo" namespace="manganKoTsumo.learn">
      <ManganKoTsumoGuide />
    </LearnPageLayout>
  );
}
