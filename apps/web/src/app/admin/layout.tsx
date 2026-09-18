export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { NuqsAdapter } from "nuqs/adapters/next/app";

import { SITE_NAME } from "@/app/_lib/metadata";

export const metadata: Metadata = {
  title: `Admin - ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

/** サイドバーのナビゲーション項目（href と admin 名前空間の i18n キー） */
const NAV_ITEMS = [
  { href: "/admin/users", labelKey: "users" },
  { href: "/admin/announcements", labelKey: "announcements.navLabel" },
  { href: "/admin/audit-log", labelKey: "auditLog" },
  { href: "/admin/activity-log", labelKey: "activityLog" },
] as const;

export default async function AdminLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  // 認証は各ページの requireAdminPage() で行う。シェル（サイドバー）を即時描画し、
  // ページ本体の認証待ち + データ取得を各ルートの loading.tsx 1 枚で覆うため。
  const t = await getTranslations("admin");

  return (
    // 管理画面はユーザー向けの pop スキンを持ち込まず、独立した見た目にする。
    // data-skin="plain" の配下は Tailwind 既定の角丸・ぼかし影・フォントへ戻る
    // （定義は globals.css）。
    <div data-skin="plain" className="flex min-h-screen">
      {/* 狭い画面ではナビを細くする。w-56 のままだと 390px 幅で本文に
          102px しか残らず、期間ピッカーのような縮まない部品が main から
          溢れる（サイドバーは畳めるようにしていないので、幅で譲る） */}
      <aside className="w-40 shrink-0 border-r border-surface-200 bg-surface-50 p-4 sm:w-56">
        {/* セクション見出し（h1）。ダッシュボードへのリンクを兼ねる */}
        <h1 className="mb-6">
          <Link
            href="/admin"
            className="block rounded px-3 py-2 text-lg font-semibold text-surface-900 transition-colors hover:bg-surface-100"
          >
            {t("title")}
          </Link>
        </h1>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded px-3 py-2 text-sm text-surface-700 transition-colors hover:bg-surface-100"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </aside>
      {/* min-w-0 が要る。flex アイテムの既定は min-width:auto で、中身の
          最小幅より狭くならない。ユーザー一覧のように列の多い表を置くと、
          表の中の overflow-x-auto が効く前にこの main 自体が広がり、
          横に流れるのが表ではなくページ全体になる（サイドバーごとずれる。
          390px 幅で 356px はみ出すのを実測）。 */}
      <main className="min-w-0 flex-1 bg-secondary p-4 sm:p-8">
        <NuqsAdapter>{children}</NuqsAdapter>
      </main>
    </div>
  );
}
