export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { requireAdmin } from './_lib/auth';

export const metadata: Metadata = {
  title: 'Admin - Mahjong Scoring',
  robots: { index: false, follow: false },
};

/** サイドバーのナビゲーション項目（href と admin 名前空間の i18n キー） */
const NAV_ITEMS = [
  { href: '/admin/users', labelKey: 'users' },
  { href: '/admin/announcements', labelKey: 'announcements.navLabel' },
  { href: '/admin/audit-log', labelKey: 'auditLog' },
  { href: '/admin/activity-log', labelKey: 'activityLog' },
] as const;

export default async function AdminLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const result = await requireAdmin();

  if ('error' in result) {
    notFound();
  }

  const t = await getTranslations('admin');

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-surface-200 bg-surface-50 p-4">
        {/* セクション見出し（h1）。ダッシュボードへのリンクを兼ねる */}
        <h1 className="mb-6">
          <Link
            href="/admin"
            className="block rounded px-3 py-2 text-lg font-semibold text-surface-900 transition-colors hover:bg-surface-100"
          >
            {t('title')}
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
      <main className="flex-1 p-8">
        <NuqsAdapter>{children}</NuqsAdapter>
      </main>
    </div>
  );
}
