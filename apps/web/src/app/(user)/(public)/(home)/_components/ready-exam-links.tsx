import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { practiceHref } from "@/app/(user)/(public)/practice/_lib/practice-catalog";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@/lib/db/practice-menu-types";
import { rankRequiringMenu } from "@/lib/ranks/registry";

interface ReadyExamLinksProps {
  /** 受験できる昇級試験の練習スラッグ */
  readonly slugs: readonly PracticeMenuSlug[];
}

/**
 * 受験できる昇級試験へのリンク（ダッシュボード用）
 * 受験可能試験リンク
 *
 * Server Component。「教本の続き」の末尾に、目次へのリンクと並べて置く。
 *
 * @design カードではなくテキストリンクで出す理由
 *
 * 昇級試験の入口は道場（`/dojo`）と教本の章末が持っており、ダッシュボードの
 * これは「前提章を読み終えたことに気付いてもらう」ための補助的な導線。
 * ページ先頭に枠付きのカードを積むと、読み込み中のスケルトンと形が食い違って
 * 本文の描画時に押し下げが起きるうえ、毎回の再訪で真っ先に目に入るのが
 * 「落ちる可能性のある試験」になる。学習の再開点（教本の続き）の隣に
 * 静かに置き、受けるかどうかは本人に委ねる。
 *
 * どのランクの要件にも紐付かない練習が渡された場合は何も描画しない
 * （試験の廃止時にリンクだけ残る事故を防ぐ）。
 */
export async function ReadyExamLinks({ slugs }: ReadyExamLinksProps) {
  const t = await getTranslations("ranks");

  const exams = slugs.flatMap((slug) => {
    const exam = rankRequiringMenu(practiceMenuBySlug(slug).menuType);
    return exam ? [{ slug, rank: exam.rank }] : [];
  });
  if (exams.length === 0) return undefined;

  return (
    <div className="flex flex-wrap gap-4">
      {exams.map(({ slug, rank }) => (
        <Link
          key={slug}
          href={practiceHref(slug)}
          className={`text-sm font-medium ${TEXT_LINK_CLASSES}`}
        >
          {t("examCta.link", { rank: t(`names.${rank.slug}`) })}
        </Link>
      ))}
    </div>
  );
}
