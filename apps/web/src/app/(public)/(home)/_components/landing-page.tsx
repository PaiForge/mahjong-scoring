import { HeroSection } from "./hero-section";
import { FeatureSection } from "./feature-section";
import { AppDownloadBanner } from "./app-download-banner";
import { Footer } from "./footer";

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeatureSection />
      <AppDownloadBanner />
      <Footer />
    </>
  );
}
