import { getTranslations } from "next-intl/server";

import { PageTitle } from "@/app/_components/page-title";
import { isSupportedLocale } from "@/i18n/locales";

import { AnnouncementForm } from "../_components/announcement-form";

interface Props {
  searchParams: Promise<{ slug?: string; locale?: string }>;
}

export default async function NewAnnouncementPage({ searchParams }: Props) {
  const { slug, locale } = await searchParams;
  const t = await getTranslations("admin.announcements");

  return (
    <div>
      <PageTitle className="mb-6">{t("createTitle")}</PageTitle>
      <AnnouncementForm
        mode="create"
        defaultSlug={slug}
        defaultLocale={locale && isSupportedLocale(locale) ? locale : undefined}
        lockSlug={Boolean(slug)}
      />
    </div>
  );
}
