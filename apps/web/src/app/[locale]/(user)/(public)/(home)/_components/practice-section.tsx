import { useTranslations } from "next-intl";

import { PlayIcon } from "@/app/[locale]/(user)/_components/icons/play-icon";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

import { LandingSection } from "./landing-section";
import { PRACTICE_PATH } from "@mahjong-scoring/features/routes";

export function PracticeSection({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const t = useTranslations("landing");

  return (
    <LandingSection
      sectionClassName="border-y border-panel bg-white"
      icon={<PlayIcon className="size-8" />}
      iconClassName="bg-brand-subtle text-brand-subtle-foreground"
      title={t("practiceTitle")}
      description={t("practiceDescription")}
      href={PRACTICE_PATH}
      locale={locale}
      ctaLabel={t("practiceCta")}
      ctaVariant="primary"
    />
  );
}
