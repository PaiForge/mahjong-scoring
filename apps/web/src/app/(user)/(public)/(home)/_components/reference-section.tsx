import { useTranslations } from "next-intl";

import { TableIcon } from "@/app/(user)/_components/icons/table-icon";

import { LandingSection } from "./landing-section";

export function ReferenceSection() {
  const t = useTranslations("landing");

  return (
    <LandingSection
      sectionClassName="border-b-4 border-ink bg-surface-50"
      icon={<TableIcon className="size-8" />}
      iconClassName="bg-amber-200 text-amber-800"
      title={t("referenceTitle")}
      description={t("referenceDescription")}
      href="/reference"
      ctaLabel={t("referenceCta")}
      ctaVariant="secondary"
    />
  );
}
