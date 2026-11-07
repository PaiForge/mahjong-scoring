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
 *
 * 英語のページでは、カードの行き先をその言語の公開 URL（`/en/reference/...`）で
 * 張る（`resolveNavTargetFor`）。英語で出していない早見表があれば、日本語の
 * ページへ素の `<a hrefLang="ja">` で向けて題名に「日本語のみ」と添える
 * （英語の存在しない URL を作らない）。日本語のページのリンクは変えない。
 *
 * route group `(index)` は、この indexの loading.tsx を兄弟ルート（`score-table` / `yaku` / `glossary` 等）の祖先にせずに置くための
 * もの。いまは静的ルートなので loading.tsx を外してあり（静的ルートは境界を持たない。不変条件と
 * 理由は `apps/web/src/app/loading-boundaries.test.ts`）、group だけが残っている。再び動的にする
 * ときは loading.tsx をこの group に置く。page.tsx を 1 つ上に移すと、そのときに兄弟を巻き込む。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TableIcon } from "@/app/[locale]/(user)/_components/icons/table-icon";
import { BookIcon } from "@/app/[locale]/(user)/_components/icons/book-icon";
import { MagnifyingGlassIcon } from "@/app/[locale]/(user)/_components/icons/magnifying-glass-icon";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import { ChevronRightIcon } from "@/app/[locale]/(user)/_components/icons/chevron-right-icon";
import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { GLOSSARY_PATH } from "@mahjong-scoring/features/glossary/routes";
import {
  REFERENCE_PATH,
  REFERENCE_YAKU_PATH,
} from "@mahjong-scoring/features/routes";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reference">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/reference");
  return createNamespaceMetadata("reference", { path: REFERENCE_PATH, locale });
}

interface ReferenceLinkDef {
  readonly href: string;
  readonly title: string;
  readonly description: string;
  readonly icon: React.ReactNode;
}

export default async function ReferenceHubPage({
  params,
}: PageProps<"/[locale]/reference">) {
  const locale = await prepareRouteLocale(params, "/reference");
  const t = await getTranslations("reference");
  const tNav = await getTranslations("nav");

  const links: readonly ReferenceLinkDef[] = [
    {
      href: "/reference/score-table",
      title: t("scoreTable.title"),
      description: t("scoreTable.description"),
      icon: <TableIcon className="size-5 text-brand-subtle-foreground" />,
    },
    {
      href: REFERENCE_YAKU_PATH,
      title: t("yaku.title"),
      description: t("yaku.description"),
      icon: <BookIcon className="size-5 text-brand-subtle-foreground" />,
    },
    {
      href: GLOSSARY_PATH,
      title: t("glossary.title"),
      description: t("glossary.description"),
      icon: (
        <MagnifyingGlassIcon className="size-5 text-brand-subtle-foreground" />
      ),
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
          {links.map((link) => {
            const target = resolveNavTargetFor(link.href, locale);
            return (
              <li key={link.href} className="min-w-0">
                <LocaleNavLink
                  navTarget={target}
                  linkKind="plain"
                  className={`group relative flex h-full items-center gap-4 rounded-panel border border-panel bg-card p-5 transition-colors hover:border-surface-300 hover:bg-surface-50 sm:block sm:p-6 ${FOCUS_RING_CLASSES}`}
                >
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-subtle sm:mb-5 sm:size-12"
                  >
                    {link.icon}
                  </span>
                  <span className="block min-w-0 flex-1">
                    <span className="block text-base font-bold tracking-wide text-foreground">
                      {link.title}
                      {target.crossLocale && (
                        <JapaneseOnlyMark
                          label={tNav("language.japaneseOnly")}
                        />
                      )}
                    </span>
                    <span className="mt-2 block text-xs font-medium leading-relaxed text-surface-500 sm:text-sm">
                      {link.description}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-surface-400 transition-colors group-hover:text-foreground group-focus-visible:text-foreground sm:absolute sm:top-10 sm:right-6"
                  >
                    <ChevronRightIcon />
                  </span>
                </LocaleNavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </ContentContainer>
  );
}
