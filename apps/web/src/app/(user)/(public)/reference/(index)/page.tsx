/**
 * リファレンス（ハブ）
 *
 * @description
 * 点数表・役などの早見表（チートシート）への入り口となるハブページ。
 * 各チートシートへの行リンクを並べる。読みに行くだけの行き先なので
 * カードにはしない。
 *
 * @flow
 * 行リンクから点数表（/reference/score-table）・役一覧（/reference/yaku）・
 * 用語集（/reference/glossary）へ遷移する。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TableIcon } from "@/app/(user)/_components/icons/table-icon";
import { BookIcon } from "@/app/(user)/_components/icons/book-icon";
import { MagnifyingGlassIcon } from "@/app/(user)/_components/icons/magnifying-glass-icon";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { GLOSSARY_PATH } from "@/lib/glossary/routes";

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

      <LinkRowList>
        {links.map((link) => (
          <LinkRow
            key={link.href}
            href={link.href}
            leading={<span aria-hidden="true">{link.icon}</span>}
            title={link.title}
            description={link.description}
          />
        ))}
      </LinkRowList>
    </ContentContainer>
  );
}
