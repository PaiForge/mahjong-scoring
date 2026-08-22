import { getTranslations } from "next-intl/server";
import { ChevronRightIcon } from "@/app/_components/icons/chevron-right-icon";
import { LinkButton } from "@/app/_components/link-button";

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
  // クエリ文字列やハッシュは除いてスラッグだけを取り出す
  // （例: `/practice/score-table?roles=ko` → `score-table`）。
  const pathOnly = href.split(/[?#]/)[0];
  const match = /^\/practice\/([a-z0-9-]+)\/?$/.exec(pathOnly);
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
    // 練習名が引けたときは「<練習名>にチャレンジ」、引けないときは汎用 CTA。
    const label =
      titleKey && tPractice.has(titleKey)
        ? t("practiceLinkChallengeCta", { title: tPractice(titleKey) })
        : t("practiceLinkCta");
    return { href, label };
  });

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-surface-900">
        {t("practiceLinksTitle")}
      </h2>
      <div
        className={
          items.length === 1
            ? undefined
            : "grid grid-cols-1 gap-3 md:grid-cols-2"
        }
      >
        {items.map((item) => (
          <PracticeLinkButton
            key={item.href}
            href={item.href}
            label={item.label}
          />
        ))}
      </div>
    </section>
  );
}

interface PracticeLinkButtonProps {
  readonly href: string;
  /** ボタンに表示する CTA ラベル */
  readonly label: string;
}

/**
 * 練習への導線ボタン
 * 練習リンクボタン
 *
 * 押せることが一目で分かるよう塗りのプライマリボタンで示し、右端のチェブロンで
 * 画面遷移を伴うことを明示する。遷移待ち中はチェブロンがスピナーへ変わる。
 */
function PracticeLinkButton({ href, label }: PracticeLinkButtonProps) {
  return (
    <LinkButton
      href={href}
      size="lg"
      fullWidth
      className="gap-3"
      trailingIcon={<ChevronRightIcon className="size-5" />}
    >
      {/* ラベルに残り幅を持たせ、チェブロンをボタンの右端へ寄せる
          （justify-* を className で足しても基底の justify-center には勝てない）。 */}
      <span className="min-w-0 flex-1 text-center">{label}</span>
    </LinkButton>
  );
}
