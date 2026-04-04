import { useTranslations } from "next-intl";

import { PlayIcon } from "@/app/_components/icons/play-icon";

import { LandingSection } from "./landing-section";

export function PracticeSection() {
  const t = useTranslations("landing");

  return (
    <LandingSection
      sectionClassName="border-y border-surface-200 bg-white"
      icon={<PlayIcon className="size-8" />}
      iconClassName="bg-primary-500/10 text-primary-600"
      title={t("practiceTitle")}
      description={t("practiceDescription")}
      href="/practice"
      ctaLabel={t("practiceCta")}
      ctaClassName="bg-primary-600 text-white hover:bg-primary-700"
    />
  );
}
