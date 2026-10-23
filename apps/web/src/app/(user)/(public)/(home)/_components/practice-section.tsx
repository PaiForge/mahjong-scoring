import { useTranslations } from "next-intl";

import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";

import { LandingSection } from "./landing-section";
import { PRACTICE_PATH } from "@mahjong-scoring/features/routes";

export function PracticeSection() {
  const t = useTranslations("landing");

  return (
    <LandingSection
      sectionClassName="border-y border-panel bg-white"
      icon={<PlayIcon className="size-8" />}
      iconClassName="bg-brand-subtle text-brand-subtle-foreground"
      title={t("practiceTitle")}
      description={t("practiceDescription")}
      href={PRACTICE_PATH}
      ctaLabel={t("practiceCta")}
      ctaVariant="primary"
    />
  );
}
