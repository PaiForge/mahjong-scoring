import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import {
  practiceSlugFromHref,
  practiceTitleKey,
} from "@/app/(user)/(public)/practice/_lib/practice-catalog";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { LinkButton } from "@/app/(user)/_components/link-button";

interface PracticeLinkListProps {
  /** `/practice/<slug>` 形式のリンク集 */
  readonly hrefs: readonly string[];
}

/**
 * 練習リンクカード群の並び
 * 練習リンク一覧
 *
 * - 0 件: 何も描画しない
 * - 1 件: フル幅（1 カラム）
 * - 2 件以上: モバイル 1 カラム / デスクトップ 2 カラムのグリッド
 *
 * 見出しを含む外枠は {@link PracticeLinkSection} が持つ。呼び出し側で
 * 組み合わせて使う（このコンポーネントを async の入れ子にすると、
 * 関数として呼び出す単体テストから中身が見えなくなるため分けている）。
 *
 * @remarks
 * 練習タイトルは href から `practiceSlugFromHref()` で slug を取り、カタログの
 * `practiceTitleKey()` で i18n キーに変換して解決する。next-intl はキーが未登録の
 * 場合に「キー文字列自体」を返す仕様のため、辞書漏れがユーザーに視覚的に露出する
 * リスクがある。ここでは `t.has()` で存在確認し、ミスヒット時は汎用 CTA ラベル
 * （`learnCurriculum.chapter.practiceLinkCta`）に fallback する。
 */
export async function PracticeLinkList({ hrefs }: PracticeLinkListProps) {
  if (hrefs.length === 0) return undefined;

  const t = await getTranslations("learnCurriculum.chapter");
  const tPractice = await getTranslations("practice");

  const items = hrefs.map((href) => {
    const slug = practiceSlugFromHref(href);
    const titleKey = slug ? practiceTitleKey(slug) : undefined;
    // 練習名が引けたときは「<練習名>にチャレンジ」、引けないときは汎用 CTA。
    const label =
      titleKey && tPractice.has(titleKey)
        ? t("practiceLinkChallengeCta", { title: tPractice(titleKey) })
        : t("practiceLinkCta");
    return { href, label };
  });

  return (
    <div
      className={
        items.length === 1 ? undefined : "grid grid-cols-1 gap-3 md:grid-cols-2"
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
  );
}

interface PracticeLinkSectionProps {
  /** 練習への導線（{@link PracticeLinkButton} を並べる） */
  readonly children: ReactNode;
}

/**
 * 章ページの「この章に対応する練習」セクション
 * 練習セクション
 *
 * 見出しと余白だけを持つ外枠。カタログ登録済みの練習を並べる
 * {@link PracticeLinkList} と、カタログ外の練習（自由練習の絞り込み等）へ
 * 章本文から直接誘導するガイドの双方がこれを使い、見出し文言と体裁を揃える。
 */
export async function PracticeLinkSection({
  children,
}: PracticeLinkSectionProps) {
  const t = await getTranslations("learnCurriculum.chapter");

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-surface-900">
        {t("practiceLinksTitle")}
      </h2>
      {children}
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
 *
 * カタログ外の練習（自由練習の `/practice/score` 等）へ章本文から誘導する
 * 場合にも使えるよう公開している。カタログ登録済みの練習への導線は
 * `practiceHrefs` + {@link PracticeLinkList} が正規の経路。
 */
export function PracticeLinkButton({ href, label }: PracticeLinkButtonProps) {
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
