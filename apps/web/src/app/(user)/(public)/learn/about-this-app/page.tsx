import { createLearnMetadata } from "../_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { AboutThisAppGuide } from "./_components/about-this-app-guide";

export function generateMetadata() {
  return createLearnMetadata("aboutThisApp.learn");
}

export default function LearnAboutThisAppPage() {
  return (
    <LearnPageLayout slug="about-this-app" namespace="aboutThisApp.learn">
      <AboutThisAppGuide />
    </LearnPageLayout>
  );
}
