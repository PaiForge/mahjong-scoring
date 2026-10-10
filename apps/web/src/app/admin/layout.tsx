export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { NuqsAdapter } from "nuqs/adapters/next/app";

import { AdminNavigation } from "./_components/admin-navigation";
import "./admin.css";

import { BrandLogo } from "@/app/_components/brand-logo";
import { SITE_NAME } from "@/app/_lib/metadata";
import { adminClientMessages } from "@/i18n/client-messages";

export const metadata: Metadata = {
  title: `Admin - ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  // 認証は各ページの requireAdminPage() で行う。シェル（サイドバー）を即時描画し、
  // ページ本体の認証待ち + データ取得を各ルートの loading.tsx 1 枚で覆うため。
  const t = await getTranslations("admin");

  const groups = [
    {
      label: t("navigation.overview"),
      items: [{ href: "/admin", label: t("dashboard") }],
    },
    {
      label: t("navigation.management"),
      items: [
        { href: "/admin/users", label: t("users") },
        { href: "/admin/reports", label: t("reports.navLabel") },
        { href: "/admin/benefit-grants", label: t("benefitGrants.navLabel") },
        { href: "/admin/announcements", label: t("announcements.navLabel") },
        { href: "/admin/ads", label: t("ads.navLabel") },
      ],
    },
    {
      label: t("navigation.logs"),
      items: [
        { href: "/admin/audit-log", label: t("auditLog") },
        { href: "/admin/activity-log", label: t("activityLog") },
      ],
    },
  ];

  return (
    // 管理画面のクライアントコンポーネントが引く辞書（admin.*）はルートの辞書に
    // 入れず、ここで渡す。ユーザー向けの全ページが管理画面の文言を運ばないため
    // （`i18n/client-messages.ts`）。入れ子の Provider は親の辞書を置き換える
    <NextIntlClientProvider messages={adminClientMessages}>
      <div data-skin="plain" className="admin-shell">
        <a href="#admin-main" className="admin-skip-link">
          {t("navigation.skipToContent")}
        </a>
        <aside className="admin-sidebar">
          <Link href="/admin" className="admin-brand">
            <BrandLogo size="lg" />
            <h1 className="text-sm font-bold tracking-tight text-primary-900">
              {t("title")}
            </h1>
          </Link>
          <AdminNavigation groups={groups} label={t("title")} />
        </aside>
        <div className="admin-content">
          <header className="admin-topbar">
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-primary-600"
              />
              {t("navigation.workspace")}
            </span>
            <Link
              href="/"
              className="font-medium text-primary-700 hover:underline"
            >
              {t("navigation.backToSite")} <span aria-hidden="true">↗</span>
            </Link>
          </header>
          <main id="admin-main" tabIndex={-1} className="admin-main">
            <NuqsAdapter>{children}</NuqsAdapter>
          </main>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
