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
      <aside className="w-56 border-r border-gray-200 bg-gray-50 p-4">
        <div className="text-lg font-semibold mb-6">
          {t('title')}
        </div>
        <nav className="space-y-2">
          <Link
            href="/admin/users"
            className="block px-3 py-2 rounded text-sm hover:bg-gray-200 transition-colors"
          >
            {t('users')}
          </Link>
          <Link
            href="/admin/audit-log"
            className="block px-3 py-2 rounded text-sm hover:bg-gray-200 transition-colors"
          >
            {t('auditLog')}
          </Link>
          <Link
            href="/admin/activity-log"
            className="block px-3 py-2 rounded text-sm hover:bg-gray-200 transition-colors"
          >
            {t('activityLog')}
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <NuqsAdapter>{children}</NuqsAdapter>
      </main>
    </div>
  );
}
