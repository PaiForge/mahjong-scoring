/**
 * リファレンス（ハブ）
 *
 * @description
 * 点数表・役などの早見表（チートシート）への入り口となるハブページ。
 * 各チートシートへの入口を、細枠のカードで一覧にする。
 *
 * @flow
 * メニューから点数表（/reference/score-table）・役一覧（/reference/yaku）・
 * 用語集（/reference/glossary）へ遷移する。
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TableIcon } from "@/app/(user)/_components/icons/table-icon";
import { BookIcon } from "@/app/(user)/_components/icons/book-icon";
import { MagnifyingGlassIcon } from "@/app/(user)/_components/icons/magnifying-glass-icon";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { GLOSSARY_PATH } from "@mahjong-scoring/features/glossary/routes";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("reference", { path: "/reference" });
}

interface ReferenceLinkDef {
  readonly href: string;
  readonly title: string;
  readonly description: string;
  readonly icon: React.ReactNode;
}

export default async function ReferenceHubPage() {
  const t = await getTranslations("reference");

  const links: readonly ReferenceLinkDef[] = [
    {
      href: "/reference/score-table",
      title: t("scoreTable.title"),
      description: t("scoreTable.description"),
      icon: <TableIcon className="size-5 text-primary-600" />,
    },
    {
      href: "/reference/yaku",
      title: t("yaku.title"),
      description: t("yaku.description"),
      icon: <BookIcon className="size-5 text-primary-600" />,
    },
    {
      href: GLOSSARY_PATH,
      title: t("glossary.title"),
      description: t("glossary.description"),
      icon: <MagnifyingGlassIcon className="size-5 text-primary-600" />,
    },
  ];

  return (
    <ContentContainer breadcrumb={[{ label: t("title") }]}>
      <PageTitle>{t("title")}</PageTitle>

      <SectionTitle className="mb-3">{t("sectionTitle")}</SectionTitle>
      <p className="mb-6 text-sm font-medium leading-relaxed text-surface-500">
        {t("description")}
      </p>

      <nav aria-label={t("title")}>
        <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {links.map((link) => (
            <li key={link.href} className="min-w-0">
              <Link
                href={link.href}
                className={`group relative flex h-full items-center gap-4 rounded-panel border border-panel bg-card p-5 transition-colors hover:border-primary-200 hover:bg-primary-50/40 sm:block sm:p-6 ${FOCUS_RING_CLASSES}`}
              >
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 sm:mb-5 sm:size-12"
                >
                  {link.icon}
                </span>
                <span className="block min-w-0 flex-1">
                  <span className="block text-base font-bold tracking-wide text-foreground">
                    {link.title}
                  </span>
                  <span className="mt-2 block text-xs font-medium leading-relaxed text-surface-500 sm:text-sm">
                    {link.description}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-surface-400 transition-colors group-hover:text-primary-700 group-focus-visible:text-primary-700 sm:absolute sm:top-10 sm:right-6"
                >
                  <ChevronRightIcon />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </ContentContainer>
  );
}
