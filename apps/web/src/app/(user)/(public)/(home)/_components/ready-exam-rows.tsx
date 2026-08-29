import { getTranslations } from "next-intl/server";

import { practiceHref } from "@/app/(user)/(public)/practice/_lib/practice-catalog";
import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@/lib/db/practice-menu-types";
import { rankRequiringMenu } from "@/lib/ranks/registry";

interface ReadyExamRowsProps {
  /** 受験できる昇級試験の練習スラッグ */
  readonly slugs: readonly PracticeMenuSlug[];
}

/**
 * 受験できる昇級試験への行リンク（ダッシュボード用）
 * 受験可能試験リンク
 *
 * Server Component。「教本の続き」の章の下に 1 行として置く。
 *
 * @design 帯色のカードではなく行リンクで出す理由
 *
 * 昇級試験の入口は道場（`/dojo`）と教本の章末が持っており、ダッシュボードの
 * これは「前提章を読み終えたことに気付いてもらう」ための補助的な導線。
 * ページ先頭に枠付きのカードを積むと、読み込み中のスケルトンと形が食い違って
 * 本文の描画時に押し下げが起きるうえ、毎回の再訪で真っ先に目に入るのが
 * 「落ちる可能性のある試験」になる。遷移先も試験の説明ページで、押した
 * ところで試験は始まらない — 太枠 + ハードシャドウの「押して始める面」では
 * なく、見に行くための行リンク（{@link LinkRow}）が正しい重み。
 *
 * どのランクの要件にも紐付かない練習が渡された場合は何も描画しない
 * （試験の廃止時に導線だけ残る事故を防ぐ）。
 */
export async function ReadyExamRows({ slugs }: ReadyExamRowsProps) {
  const t = await getTranslations("ranks");

  const exams = slugs.flatMap((slug) => {
    const exam = rankRequiringMenu(practiceMenuBySlug(slug).menuType);
    return exam ? [{ slug, rankSlug: exam.rank.slug }] : [];
  });
  if (exams.length === 0) return undefined;

  return (
    <LinkRowList>
      {exams.map(({ slug, rankSlug }) => (
        <LinkRow
          key={slug}
          href={practiceHref(slug)}
          // 道場（マイページの行リンク）と同じ帯のアイコン。すぐ上に並ぶ
          // 教本の章の行と同じ見た目にならないよう、行頭で種類を示す
          leading={
            <span className="text-base" aria-hidden="true">
              🥋
            </span>
          }
          title={t("examCta.title", { rank: t(`names.${rankSlug}`) })}
          description={`${t("examCta.criterionLabel")}: ${t(`criteria.${rankSlug}`)}`}
        />
      ))}
    </LinkRowList>
  );
}
