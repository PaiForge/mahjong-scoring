import {
  CURRICULUM,
  type CurriculumChapter,
  pickNextChapter,
} from "@/app/(user)/(public)/learn/_lib/curriculum";
import { practiceSlugFromHref } from "@/app/(user)/(public)/practice/_lib/practice-catalog";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";

/** ダッシュボードに出すおすすめ練習の上限。増やすと練習一覧の縮小版になる */
const MAX_RECOMMENDED_PRACTICES = 2;

/** ダッシュボードの学習導線 */
export interface DashboardGuidance {
  /** 次に読む章。全章読了済みなら undefined */
  readonly nextChapter: CurriculumChapter | undefined;
  /** 読んだのにまだ挑戦していない練習（カリキュラム順、最大 2 件） */
  readonly recommendedPracticeSlugs: readonly PracticeMenuSlug[];
  /** 教本も練習も勧めるものが無いとき、総合演習へ誘導するか */
  readonly showComprehensivePractice: boolean;
}

interface SelectDashboardGuidanceInput {
  /** 読了済み章のスラッグ */
  readonly readSlugs: ReadonlySet<string>;
  /** 一度でも挑戦したことのある練習のスラッグ */
  readonly attemptedSlugs: ReadonlySet<PracticeMenuSlug>;
}

/**
 * 読了状況と練習履歴からダッシュボードに出す導線を決める。
 * 学習導線の選択
 *
 * @description
 * 学習は「章を読む → 対応する練習を解く → 次の章へ」の順で進む。教本の章ページが
 * 「読んだ直後の練習」を既に案内しているので、ダッシュボードが埋めるのは
 * **読んだのに練習していない**取りこぼしのほう。よって次に読む章の練習ではなく、
 * 読了済み章の練習から未挑戦のものを勧める。
 *
 * 勧めるものが無いときはセクションごと出さない。教本を読み切って練習も一通り
 * 触れている場合だけ、終わりのない総合演習をフォールバックとして出す。
 *
 * @param readSlugs 読了済み章のスラッグ
 * @param attemptedSlugs 挑戦済み練習のスラッグ
 */
export function selectDashboardGuidance({
  readSlugs,
  attemptedSlugs,
}: SelectDashboardGuidanceInput): DashboardGuidance {
  const nextChapter = pickNextChapter(readSlugs);

  const recommended: PracticeMenuSlug[] = [];
  const seen = new Set<PracticeMenuSlug>();

  const readChaptersInOrder = [...CURRICULUM]
    .sort((a, b) => a.order - b.order)
    .filter((chapter) => readSlugs.has(chapter.slug));

  for (const chapter of readChaptersInOrder) {
    for (const href of chapter.practiceHrefs ?? []) {
      const slug = practiceSlugFromHref(href);
      if (slug === undefined) continue;
      if (attemptedSlugs.has(slug) || seen.has(slug)) continue;
      seen.add(slug);
      recommended.push(slug);
      if (recommended.length === MAX_RECOMMENDED_PRACTICES) {
        return {
          nextChapter,
          recommendedPracticeSlugs: recommended,
          showComprehensivePractice: false,
        };
      }
    }
  }

  return {
    nextChapter,
    recommendedPracticeSlugs: recommended,
    showComprehensivePractice:
      nextChapter === undefined && recommended.length === 0,
  };
}
