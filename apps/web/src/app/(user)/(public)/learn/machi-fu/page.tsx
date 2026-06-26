import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { MachiFuGuide } from "./_components/machi-fu-guide";

export function generateMetadata() {
  return createLearnMetadata("machiFu.learn");
}

export default function LearnMachiFuPage() {
  return (
    <LearnPageLayout slug="machi-fu" namespace="machiFu.learn">
      <MachiFuGuide />
    </LearnPageLayout>
  );
}
