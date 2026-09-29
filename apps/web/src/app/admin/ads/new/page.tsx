import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { isAdSlot } from "@/lib/ads/registry";

import { AdCreativeForm } from "../_components/ad-creative-form";

interface Props {
  searchParams: Promise<{ slot?: string }>;
}

export default async function NewAdCreativePage({ searchParams }: Props) {
  await requireAdminPage();

  const { slot } = await searchParams;
  if (slot === undefined || !isAdSlot(slot)) notFound();

  const t = await getTranslations("admin.ads");

  return (
    <div className="space-y-6">
      <AdminPageTitle>{t("createTitle")}</AdminPageTitle>
      <AdCreativeForm mode="create" slot={slot} />
    </div>
  );
}
