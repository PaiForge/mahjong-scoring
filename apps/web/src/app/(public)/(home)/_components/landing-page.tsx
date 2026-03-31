import { HeroSection } from "./hero-section";
import { FeatureSection } from "./feature-section";
import { AppDownloadBanner } from "./app-download-banner";

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeatureSection />
      <AppDownloadBanner />
    </>
  );
}
