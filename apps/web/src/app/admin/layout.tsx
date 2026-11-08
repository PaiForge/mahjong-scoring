export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { EnvironmentRibbon } from "env-ribbon";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { NuqsAdapter } from "nuqs/adapters/next/app";

import "../globals.css";
import { AdminNavigation } from "./_components/admin-navigation";
import "./admin.css";

import { AppVersionWatcher } from "@/app/_components/app-version-watcher";
import { BrandLogo } from "@/app/_components/brand-logo";
import { GlobalToaster } from "@/app/_components/global-toaster";
import { GoogleAnalytics } from "@/app/_components/google-analytics";
import { ScrollReset } from "@/app/_components/scroll-reset";
import { AuthProvider } from "@/app/_contexts/auth-context";
import { AppTileImageProvider } from "@/app/_contexts/tile-image-context";
import { SITE_NAME } from "@/app/_lib/metadata";
import { SITE_URL } from "@/config";
import { adminClientMessages } from "@/i18n/client-messages";
import { DEFAULT_LOCALE } from "@mahjong-scoring/features/i18n/locales";

export const metadata: Metadata = {
  // 相対 URL（metadata の画像等）を絶対 URL へ解決する基準。管理画面は
  // ユーザー向けの言語レイアウトの下に無いので、自分で持つ。
  metadataBase: new URL(SITE_URL),
  title: `Admin - ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

/** 管理画面の言語（英語の版を作らない） */
const ADMIN_LOCALE = DEFAULT_LOCALE;

/**
 * 管理画面のルートレイアウト
 *
 * @design ユーザー向けの言語レイアウトとは別のルートレイアウト
 * 管理画面は `app/[locale]` の外にあり、`<html>` / `<body>`・グローバル CSS・
 * Provider を自分で持つ。持つものは旧来の共通ルートレイアウトと同じ
 * （スクロールの初期化・版の監視・牌画像・認証・トースト・解析タグ・環境リボン）
 * で、辞書だけが管理画面用（`adminClientMessages`）になる。共通のルート
 * レイアウトを置いて HTML を持たせると、言語レイアウトの `<html lang>` と二重に
 * なるため置かない。言語は日本語固定で、`setRequestLocale` で確定させてから
 * 翻訳を引く（管理画面は `force-dynamic` なので headers を読んでも静的生成は
 * 失わないが、言語を URL やヘッダから推測しない）。
 */
export default async function AdminLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  setRequestLocale(ADMIN_LOCALE);
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
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
    <html lang={ADMIN_LOCALE}>
      <body className="min-h-screen overflow-x-hidden">
        <ScrollReset />
        <AppVersionWatcher />
        {/* 管理画面のクライアントコンポーネントが引く辞書（admin.* と共有部品の
            nav）だけを渡す。ユーザー向けの辞書を管理画面に、管理画面の文言を
            ユーザー向けの全ページに運ばないため（`i18n/client-messages.ts`） */}
        <NextIntlClientProvider
          locale={ADMIN_LOCALE}
          messages={adminClientMessages}
        >
          <AppTileImageProvider>
            <AuthProvider>
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
                      {t("navigation.backToSite")}{" "}
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </header>
                  <main id="admin-main" tabIndex={-1} className="admin-main">
                    <NuqsAdapter>{children}</NuqsAdapter>
                  </main>
                </div>
              </div>
            </AuthProvider>
          </AppTileImageProvider>
          <GlobalToaster />
        </NextIntlClientProvider>
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <EnvironmentRibbon />
      </body>
    </html>
  );
}
