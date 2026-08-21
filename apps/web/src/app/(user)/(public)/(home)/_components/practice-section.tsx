import { useTranslations } from "next-intl";

import { PlayIcon } from "@/app/_components/icons/play-icon";

import { LandingSection } from "./landing-section";

export function PracticeSection() {
  const t = useTranslations("landing");

  return (
    <LandingSection
      sectionClassName="border-y-4 border-ink bg-white"
      icon={<PlayIcon className="size-8" />}
      iconClassName="bg-primary-200 text-primary-800"
      title={t("practiceTitle")}
      description={t("practiceDescription")}
      href="/practice"
      ctaLabel={t("practiceCta")}
      ctaClassName="bg-primary-600 text-white hover:bg-primary-700"
    />
  );
}
