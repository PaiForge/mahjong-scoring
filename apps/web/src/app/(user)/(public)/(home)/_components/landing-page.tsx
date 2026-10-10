import { HeroSection } from "./hero-section";
import { PracticeSection } from "./practice-section";
import { ReferenceSection } from "./reference-section";
import { LearnSection } from "./learn-section";

export function LandingPage() {
  return (
    <div className="home-design contents">
      <HeroSection />
      <PracticeSection />
      <ReferenceSection />
      <LearnSection />
    </div>
  );
}
