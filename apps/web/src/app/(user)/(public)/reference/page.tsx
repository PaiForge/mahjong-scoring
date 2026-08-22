/**
 * リファレンス（ハブ）
 *
 * @description
 * 点数表・役などの早見表（チートシート）への入り口となるハブページ。
 * 各チートシートをカードで一覧表示する。
 *
 * @flow
 * カードから点数表（/reference/score-table）・役一覧（/reference/yaku）へ遷移する。
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { TableIcon } from "@/app/(user)/_components/icons/table-icon";
import { BookIcon } from "@/app/(user)/_components/icons/book-icon";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("reference");
}

interface ReferenceCardDef {
  readonly href: string;
  readonly title: string;
  readonly description: string;
  readonly icon: React.ReactNode;
}

export default async function ReferenceHubPage() {
  const t = await getTranslations("reference");

  const cards: readonly ReferenceCardDef[] = [
    {
      href: "/reference/score-table",
      title: t("scoreTable.title"),
      description: t("scoreTable.description"),
      icon: <TableIcon className="size-6" />,
    },
    {
      href: "/reference/yaku",
      title: t("yaku.title"),
      description: t("yaku.description"),
      icon: <BookIcon className="size-6" />,
    },
  ];

  return (
    <ContentContainer breadcrumb={[{ label: t("title") }]}>
      <PageTitle>{t("title")}</PageTitle>

      <div className="space-y-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="press-sm flex items-center gap-4 rounded-xl border-3 border-ink bg-white p-6 shadow-sm hover:bg-primary-50"
          >
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-amber-200 text-amber-700"
              aria-hidden="true"
            >
              {card.icon}
            </span>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-surface-900">
                {card.title}
              </h3>
              <p className="mt-1 text-sm text-surface-500">
                {card.description}
              </p>
            </div>
            <ChevronRightIcon className="size-5 shrink-0 text-surface-400" />
          </Link>
        ))}
      </div>
    </ContentContainer>
  );
}
