import { desc } from "drizzle-orm";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { formatAdminDateTime } from "@/app/admin/_lib/format-date";
import { type Announcement, announcements, db } from "@/lib/db";
import { AnnouncementStatus } from "@/lib/announcement-status";

import { DeleteAnnouncementButton } from "../_components/delete-announcement-button";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { adminChipClasses } from "../../_lib/chip-classes";
import { adminButtonClasses } from "../../_lib/button-classes";

export const dynamic = "force-dynamic";

function groupBySlug(rows: Announcement[]): Map<string, Announcement[]> {
  const grouped = new Map<string, Announcement[]>();
  for (const row of rows) {
    const group = grouped.get(row.slug);
    if (group) {
      group.push(row);
    } else {
      grouped.set(row.slug, [row]);
    }
  }
  return grouped;
}

export default async function AdminAnnouncementsPage() {
  await requireAdminPage();

  const t = await getTranslations("admin.announcements");

  const rows = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.updatedAt));
  const grouped = groupBySlug(rows);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminPageTitle>{t("listTitle")}</AdminPageTitle>
        <Link href="/admin/announcements/new" className={adminButtonClasses()}>
          {t("new")}
        </Link>
      </div>

      {grouped.size === 0 ? (
        <p className="text-sm text-surface-500">{t("empty")}</p>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([slug, variants]) => (
            <section key={slug} className="admin-panel">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200 px-4 py-3">
                <code className="break-all text-sm font-semibold text-surface-800">
                  {slug}
                </code>
                <Link
                  href={`/admin/announcements/new?slug=${encodeURIComponent(slug)}`}
                  className={`text-sm font-medium ${TEXT_LINK_CLASSES}`}
                >
                  {t("addVariant")}
                </Link>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 text-xs text-surface-500">
                      <th className="px-4 py-2 font-medium whitespace-nowrap">
                        {t("locale")}
                      </th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">
                        {t("title")}
                      </th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">
                        {t("status")}
                      </th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">
                        {t("publishedAt")}
                      </th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((a) => (
                      <tr key={a.id} className="border-t border-surface-200">
                        <td className="px-4 py-3">
                          <span className="font-mono">{a.locale}</span>
                          {a.pinnedAt !== null && (
                            <span
                              className={`ml-2 ${adminChipClasses("success")}`}
                            >
                              {t("pinned")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-surface-900">
                          {a.title}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={adminChipClasses(
                              a.status === AnnouncementStatus.Published
                                ? "success"
                                : "neutral",
                            )}
                          >
                            {a.status === AnnouncementStatus.Published
                              ? t("statusPublished")
                              : t("statusDraft")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-surface-500">
                          {formatAdminDateTime(a.publishedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <Link
                              href={`/admin/announcements/${a.id}/edit`}
                              className={`text-sm font-medium ${TEXT_LINK_CLASSES}`}
                            >
                              {t("edit")}
                            </Link>
                            <DeleteAnnouncementButton announcementId={a.id} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
