import { useTranslations } from "next-intl";

import { TableIcon } from "@/app/[locale]/(user)/_components/icons/table-icon";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

import { LandingSection } from "./landing-section";

export function ReferenceSection({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const t = useTranslations("landing");

  return (
    <LandingSection
      sectionClassName="border-b border-panel bg-surface-50"
      icon={<TableIcon className="size-8" />}
      iconClassName="bg-amber-200 text-amber-800"
      title={t("referenceTitle")}
      description={t("referenceDescription")}
      href="/reference/demo"
      locale={locale}
      ctaLabel={t("referenceCta")}
      ctaVariant="secondary"
    />
  );
}
