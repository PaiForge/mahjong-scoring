import {
  CURRICULUM,
  type CurriculumChapter,
  pickNextChapter,
} from "@/app/(user)/(public)/learn/_lib/curriculum";
import { practiceSlugFromHref } from "@/app/(user)/(public)/practice/_lib/practice-catalog";
import {
  menuTypeToSlug,
  type PracticeMenuSlug,
} from "@/lib/db/practice-menu-types";
import { nextRank, type RankSlug } from "@/lib/ranks/registry";

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
  /**
   * 受験の準備が整った昇級試験（練習スラッグ）。整っていなければ空。
   *
   * 「次に取る段級位の前提章をすべて読み終えていて、まだその級を持っていない」
   * ときだけ入る。
   */
  readonly readyExamSlugs: readonly PracticeMenuSlug[];
}

interface SelectDashboardGuidanceInput {
  /** 読了済み章のスラッグ */
  readonly readSlugs: ReadonlySet<string>;
  /** 一度でも挑戦したことのある練習のスラッグ */
  readonly attemptedSlugs: ReadonlySet<PracticeMenuSlug>;
  /** 取得済みの段級位 */
  readonly achievedRankSlugs: readonly RankSlug[];
}

/**
 * 次に取る段級位の前提章を読み終えているなら、その昇級試験を返す。
 * 受験可能試験の判定
 *
 * @design 読了で出し分ける理由
 *
 * 昇級試験はミス1回で終了する、このアプリで唯一「落ちる」コンテンツ。
 * 無条件にダッシュボードへ出すと、まだ何も読んでいない人に最初の行動として
 * 落ちる試験を勧めることになる。前提章を読み終えた時点＝教材を一周した
 * 時点で初めて出すことで、ダッシュボードの「次にやること」が
 * 「章を読む → 練習する → 受験する」の順に自然に切り替わる。
 *
 * 練習の挑戦履歴までは条件にしない。前提章の読了が「教材を通した」線で、
 * そこから先どれだけ練習してから受けるかは本人が決めればよい
 * （カードは合格基準を示すだけで、その場では試験が始まらない）。
 */
function selectReadyExamSlugs(
  readSlugs: ReadonlySet<string>,
  achievedRankSlugs: readonly RankSlug[],
): readonly PracticeMenuSlug[] {
  const next = nextRank(achievedRankSlugs);
  if (!next) return [];

  // 前提章を持たない段級位（教本の章がまだ無いもの）では条件が空になり、
  // 読了を待たずにカードが出る。読むべき章が無い以上は正しい振る舞いで、
  // 章を足せば自動的に「読み終えてから」に戻る
  const prerequisitesRead = next.learnChapterSlugs.every((slug) =>
    readSlugs.has(slug),
  );
  if (!prerequisitesRead) return [];

  return next.requirements.map((requirement) =>
    menuTypeToSlug(requirement.menuType),
  );
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
  achievedRankSlugs,
}: SelectDashboardGuidanceInput): DashboardGuidance {
  const nextChapter = pickNextChapter(readSlugs);
  const readyExamSlugs = selectReadyExamSlugs(readSlugs, achievedRankSlugs);

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
          readyExamSlugs,
        };
      }
    }
  }

  return {
    nextChapter,
    recommendedPracticeSlugs: recommended,
    // 受験できる試験があるなら、それが「次にやること」。総合演習は
    // 勧めるものが本当に何も無いときのフォールバックなので譲る
    showComprehensivePractice:
      nextChapter === undefined &&
      recommended.length === 0 &&
      readyExamSlugs.length === 0,
    readyExamSlugs,
  };
}
