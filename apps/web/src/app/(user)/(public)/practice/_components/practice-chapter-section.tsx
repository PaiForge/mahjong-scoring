import { ChapterTocList } from "@/app/(user)/(public)/learn/_components/chapter-toc-list";
import { CurriculumTocLink } from "@/app/(user)/(public)/learn/_components/curriculum-toc-link";
import type { CurriculumChapterSlug } from "@/app/(user)/(public)/learn/_lib/curriculum";
import { SectionTitle } from "@/app/(user)/_components/section-title";

/**
 * 教本の読了状態を持たない空集合。
 *
 * 練習側に出す章の並びは読了チェックを出さないため、読了状態を引かない。
 * ここで読了状態を取ると認証 Cookie に触れ、静的に配信できる練習の説明
 * ページが全ページ動的レンダリングに落ちる。読了の進捗を見せる場は
 * `/learn` とダッシュボードが持つ。
 */
const NO_READ_SLUGS: ReadonlySet<string> = new Set();

interface PracticeChapterSectionProps {
  /** 見出し（「関連する教本の章」/ 試験の「前提となる教本の章」） */
  readonly title: string;
  /** 並べる章（カリキュラムの表示順で渡す）。0 件ならセクションごと出さない */
  readonly slugs: readonly CurriculumChapterSlug[];
}

/**
 * 練習ページに置く教本の章のセクション
 * 練習の教本セクション
 *
 * 見た目は目次（{@link ChapterTocList}）をそのまま使い、ダッシュボードの
 * 「教本の続き」や `/learn` と同じ書式に揃える。章タイトル・説明文も
 * カリキュラム側の文言をそのまま使うため、練習ごとのリンク文言は持たない。
 *
 * 見出しと章の集合は呼び出し側が決める。練習と昇級試験で意味が変わり
 * （関連する章 / 合格に必要な知識の全体）、出どころも変わるため。
 */
export function PracticeChapterSection({
  title,
  slugs,
}: PracticeChapterSectionProps) {
  if (slugs.length === 0) return undefined;

  return (
    <div className="space-y-3">
      <SectionTitle>{title}</SectionTitle>
      <ChapterTocList slugs={slugs} readSlugs={NO_READ_SLUGS} />
      <CurriculumTocLink />
    </div>
  );
}
