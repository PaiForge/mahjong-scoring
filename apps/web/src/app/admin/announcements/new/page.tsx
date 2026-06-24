import { getTranslations } from "next-intl/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { isSupportedLocale } from "@/i18n/locales";

import { AnnouncementForm } from "../_components/announcement-form";

interface Props {
  searchParams: Promise<{ slug?: string; locale?: string }>;
}

export default async function NewAnnouncementPage({ searchParams }: Props) {
  await requireAdminPage();

  const { slug, locale } = await searchParams;
  const t = await getTranslations("admin.announcements");

  return (
    <div className="space-y-6">
      <AdminPageTitle>{t("createTitle")}</AdminPageTitle>
      <AnnouncementForm
        mode="create"
        defaultSlug={slug}
        defaultLocale={locale && isSupportedLocale(locale) ? locale : undefined}
        lockSlug={Boolean(slug)}
      />
    </div>
  );
}
