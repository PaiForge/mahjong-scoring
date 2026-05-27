import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronRightIcon } from "@/app/_components/icons/chevron-right-icon";

interface PracticeLinkListProps {
  /** `/practice/<slug>` 形式のリンク集 */
  readonly hrefs: readonly string[];
}

/**
 * `/practice/jantou-fu` 等の href から `practice.practices.<camelKey>.title` の
 * i18n キーを導出する。変換失敗時は undefined。
 *
 * @param href 練習ページへのパス
 */
function practiceSlugFromHref(href: string): string | undefined {
  const match = /^\/practice\/([a-z0-9-]+)\/?$/.exec(href);
  if (!match) return undefined;
  return match[1];
}

function toCamelCase(slug: string): string {
  return slug.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/**
 * 章ページに配置する練習リンクカード群のレイアウトラッパー
 * 練習リンク一覧
 *
 * - 0 件: 何も描画しない
 * - 1 件: フル幅（1 カラム）
 * - 2 件以上: モバイル 1 カラム / デスクトップ 2 カラムのグリッド
 *
 * @remarks
 * 練習タイトルは `/practice/<slug>` の slug から `practice.practices.<camelSlug>.title`
 * を動的生成して解決する。next-intl はキーが未登録の場合に「キー文字列自体」を返す
 * 仕様のため、タイポや辞書漏れがユーザーに視覚的に露出するリスクがある。
 * ここでは `t.has()` で存在確認し、ミスヒット時は汎用 CTA ラベル
 * （`learnCurriculum.chapter.practiceLinkCta`）に fallback する。
 */
export async function PracticeLinkList({ hrefs }: PracticeLinkListProps) {
  if (hrefs.length === 0) return undefined;

  const t = await getTranslations("learnCurriculum.chapter");
  const tPractice = await getTranslations("practice");

  const items = hrefs.map((href) => {
    const slug = practiceSlugFromHref(href);
    const titleKey = slug ? `practices.${toCamelCase(slug)}.title` : undefined;
    const title =
      titleKey && tPractice.has(titleKey)
        ? tPractice(titleKey)
        : t("practiceLinkCta");
    return { href, title };
  });

  return (
    <section className="mt-10">
      <h2 className="text-base font-semibold text-surface-900">
        {t("practiceLinksTitle")}
      </h2>
      <div
        className={
          items.length === 1
            ? "mt-4"
            : "mt-4 grid grid-cols-1 gap-3 md:grid-cols-2"
        }
      >
        {items.map((item) => (
          <PracticeLinkCardPresentation
            key={item.href}
            href={item.href}
            title={item.title}
            ctaLabel={t("practiceLinkCta")}
          />
        ))}
      </div>
    </section>
  );
}

interface PracticeLinkCardPresentationProps {
  readonly href: string;
  readonly title: string;
  readonly ctaLabel: string;
}

function PracticeLinkCardPresentation({
  href,
  title,
  ctaLabel,
}: PracticeLinkCardPresentationProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl border border-surface-200 bg-white p-4 shadow-sm transition-colors hover:bg-surface-50"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-surface-900">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-primary-600">{ctaLabel}</p>
      </div>
      <ChevronRightIcon className="size-5 shrink-0 text-surface-400" />
    </Link>
  );
}
