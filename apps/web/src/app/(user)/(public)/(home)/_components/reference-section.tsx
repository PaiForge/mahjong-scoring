import { useTranslations } from "next-intl";

import { TableIcon } from "@/app/_components/icons/table-icon";

import { LandingSection } from "./landing-section";

export function ReferenceSection() {
  const t = useTranslations("landing");

  return (
    <LandingSection
      sectionClassName="bg-surface-50"
      icon={<TableIcon className="size-8" />}
      iconClassName="bg-amber-500/10 text-amber-600"
      title={t("referenceTitle")}
      description={t("referenceDescription")}
      href="/reference"
      ctaLabel={t("referenceCta")}
      ctaClassName="border border-surface-200 bg-white text-surface-900 hover:bg-surface-50"
    />
  );
}
