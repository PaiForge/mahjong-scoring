import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import type { StoredCopy } from "@/lib/ads/copy";

import { AdCreativeForm } from "../../_components/ad-creative-form";
import { getAdCreativeById } from "../../_lib/queries";

interface Props {
  params: Promise<{ id: string }>;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 保存された文言をフォームの欄（全ロケール、書いていないロケールは空欄）にする */
function toFormCopy(copy: StoredCopy): Record<string, string> {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, copy[locale] ?? ""]),
  );
}

export default async function EditAdCreativePage({ params }: Props) {
  await requireAdminPage();

  const { id } = await params;
  // uuid 以外を DB に渡すと型エラーで 500 になるため、手前で弾く
  if (!UUID_PATTERN.test(id)) notFound();

  const [t, creative] = await Promise.all([
    getTranslations("admin.ads"),
    getAdCreativeById(id),
  ]);
  if (!creative) notFound();
  const { row, copy } = creative;

  return (
    <div className="space-y-6">
      <AdminPageTitle>{t("editTitle")}</AdminPageTitle>
      <AdCreativeForm
        mode="edit"
        slot={row.slot}
        creativeId={row.id}
        defaultValues={{
          asin: row.asin ?? "",
          href: row.href ?? "",
          isActive: row.isActive,
          icon: row.icon ?? "",
          imageUrl: row.imagePath ?? "",
          imageAlt: row.imageAlt ?? "",
          hand: row.hand ?? "",
          title: toFormCopy(copy.title),
          description: toFormCopy(copy.description),
        }}
      />
    </div>
  );
}
