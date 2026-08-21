import { useTranslations } from "next-intl";

import { BookIcon } from "@/app/_components/icons/book-icon";

import { LandingSection } from "./landing-section";

export function LearnSection() {
  const t = useTranslations("landing");

  return (
    <LandingSection
      sectionClassName="bg-white"
      icon={<BookIcon className="size-8" />}
      iconClassName="bg-primary-200 text-primary-800"
      title={t("learnTitle")}
      description={t("learnDescription")}
      href="/learn"
      ctaLabel={t("learnCta")}
      ctaClassName="bg-white text-surface-900 hover:bg-primary-50"
    />
  );
}
