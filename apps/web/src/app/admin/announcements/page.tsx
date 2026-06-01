import { desc } from "drizzle-orm";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { type Announcement, announcements, db } from "@/lib/db";

import { DeleteAnnouncementButton } from "./_components/delete-announcement-button";

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
  const t = await getTranslations("admin.announcements");

  const rows = await db.select().from(announcements).orderBy(desc(announcements.updatedAt));
  const grouped = groupBySlug(rows);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <AdminPageTitle>{t("listTitle")}</AdminPageTitle>
        <Link
          href="/admin/announcements/new"
          className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          {t("new")}
        </Link>
      </div>

      {grouped.size === 0 ? (
        <p className="text-sm text-surface-500">{t("empty")}</p>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([slug, variants]) => (
            <section key={slug} className="rounded-lg border border-surface-200">
              <header className="flex items-center justify-between border-b border-surface-200 px-4 py-3">
                <code className="text-sm font-semibold text-surface-800">{slug}</code>
                <Link
                  href={`/admin/announcements/new?slug=${encodeURIComponent(slug)}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {t("addVariant")}
                </Link>
              </header>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-100 text-xs text-surface-500">
                    <th className="px-4 py-2 font-medium">{t("locale")}</th>
                    <th className="px-4 py-2 font-medium">{t("title")}</th>
                    <th className="px-4 py-2 font-medium">{t("status")}</th>
                    <th className="px-4 py-2 font-medium">{t("publishedAt")}</th>
                    <th className="px-4 py-2 font-medium">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((a) => (
                    <tr key={a.id} className="border-t border-surface-100">
                      <td className="px-4 py-3">
                        <span className="font-mono">{a.locale}</span>
                        {a.pinnedAt !== null && (
                          <span className="ml-2 rounded bg-primary-100 px-1.5 py-0.5 text-xs font-semibold text-primary-700">
                            {t("pinned")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-surface-900">{a.title}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold ${
                            a.status === "published"
                              ? "bg-primary-100 text-primary-700"
                              : "bg-surface-100 text-surface-500"
                          }`}
                        >
                          {a.status === "published" ? t("statusPublished") : t("statusDraft")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-surface-500">
                        {a.publishedAt
                          ? new Date(a.publishedAt).toLocaleString("ja-JP")
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <Link
                            href={`/admin/announcements/${a.id}/edit`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700"
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
