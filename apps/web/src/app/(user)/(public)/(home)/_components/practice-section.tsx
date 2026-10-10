import { useTranslations } from "next-intl";

import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";

import { LandingSection } from "./landing-section";

export function PracticeSection() {
  const t = useTranslations("landing");

  return (
    <LandingSection
      sectionClassName="border-y border-panel bg-white"
      icon={<PlayIcon className="size-8" />}
      iconClassName="bg-brand-subtle text-brand-subtle-foreground"
      title={t("practiceTitle")}
      description={t("practiceDescription")}
      href="/practice"
      ctaLabel={t("practiceCta")}
      ctaVariant="primary"
    />
  );
}
