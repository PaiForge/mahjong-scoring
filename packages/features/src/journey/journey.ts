import {
  getChapterBySlug,
  type CurriculumChapterSlug,
} from "../curriculum/registry";
import { lessonForChapter, type LessonSlug } from "../lessons/registry";
import { menuTypeToSlug, type PracticeMenuSlug } from "../practice-menu-types";
import { resolveRankStatus, type RankStatus } from "../ranks/rank-status";
import {
  RANK_REGISTRY,
  nextRank,
  type RankDefinition,
  type RankSlug,
} from "../ranks/registry";

/**
 * 点数計算・黒帯への道 — 段級位ごとの行程と、その中の「次の一歩」
 * 黒帯への道
 *
 * @description
 * 段級位（5級 → … → 初段 = 黒帯）を 1 本の道として見せるためのモデル。
 * 級ごとに「学ぶ（章 / レッスン）→ 練習する → 認定される（試験に合格）」の
 * 3 段を持ち、ユーザーの読了・レッスン完了・練習の挑戦履歴・取得済みの級から
 * 各段の進み具合を出す。ダッシュボードの「次の一歩」カード・道場の行程表示・
 * 登録直後の最初の一歩が、すべてこの 1 つの計算を読む — 置き場所ごとに
 * 「次」を別々に決めると、ホームと道場で指す先が食い違う。
 *
 * @design 「学んだ」は読了またはレッスン完了
 * 章を読み終えた印（`learn_chapter_reads`）と、その章のレッスンを終えた印
 * （`lesson_completions`）はどちらも「学んだ」として数える。レッスンは
 * 章を数分に圧縮した別の道で、終えた人に同じ章を読み直せとは言わない。
 * 章が読まれたことにはしない（読了は本人が押す印のまま）。
 *
 * @design 「練習した」は一度でも挑戦したこと
 * 練習の段は「読んだのに触っていない練習」を無くすためのもので、習得の
 * 判定ではない（習得は試験が決める）。チャレンジを 1 回でも終えていれば
 * 済みとする。トレーニングは記録を残さないので数えられない — それで
 * よい。記録に残らない練習を進捗にしないのは、記録の土俵の設計と同じ。
 *
 * @design 次の一歩は 1 つだけ
 * 「次に取る級」（{@link nextRank}）の中で、学ぶ → 練習する → 認定される の
 * 順に最初の未了を 1 つだけ返す。候補を並べない — 複数の候補が出ると
 * 「今やること」ではなく一覧になる。前提章の読了を受験の条件にはしない
 * （受験資格は `evaluateExamEligibility` が級の順序だけで決める）ので、
 * 経験者は道場や試験ページから直接受けられる。この順序はあくまで案内。
 */

/** 行程の 1 段（学ぶ / 練習する / 認定される）の 1 項目 */
interface JourneyItem {
  /** 済んでいるか */
  readonly done: boolean;
}

/** 学ぶ: 章 1 つ。レッスンがあれば、それで学ぶこともできる */
export interface JourneyChapterItem extends JourneyItem {
  readonly chapterSlug: CurriculumChapterSlug;
  /** この章を数分で学べるレッスン。無ければ章を読む */
  readonly lessonSlug: LessonSlug | undefined;
}

/** 練習する: 練習 1 つ（章から送っているバリアント付き） */
export interface JourneyPracticeItem extends JourneyItem {
  readonly slug: PracticeMenuSlug;
  readonly variant: string | undefined;
}

/** 認定される: その級の昇級試験 */
export interface JourneyExamItem extends JourneyItem {
  readonly slug: PracticeMenuSlug;
}

/**
 * 1 つの級の行程
 * 級の行程
 */
export interface RankJourney {
  readonly rank: RankDefinition;
  readonly status: RankStatus;
  /** 学ぶ: 前提章（カリキュラムの順） */
  readonly chapters: readonly JourneyChapterItem[];
  /** 練習する: 前提章から送っている練習（章の順。重複は最初の 1 つ） */
  readonly practices: readonly JourneyPracticeItem[];
  /** 認定される: 昇級試験 */
  readonly exam: JourneyExamItem;
}

/**
 * 次の一歩
 * 次の一歩
 *
 * - `lesson`: 章のレッスンを受ける
 * - `read`: 章を読む（レッスンの無い章）
 * - `practice`: 練習に挑戦する
 * - `exam`: 昇級試験を受ける（学ぶ・練習するが済んだ）
 */
export type JourneyStep =
  | {
      readonly kind: "lesson";
      readonly lessonSlug: LessonSlug;
      readonly chapterSlug: CurriculumChapterSlug;
    }
  | { readonly kind: "read"; readonly chapterSlug: CurriculumChapterSlug }
  | {
      readonly kind: "practice";
      readonly slug: PracticeMenuSlug;
      readonly variant: string | undefined;
    }
  | { readonly kind: "exam"; readonly slug: PracticeMenuSlug };

/**
 * 黒帯への道の全体
 * 行程全体
 */
export interface Journey {
  /** 全段級位の行程（level 昇順） */
  readonly ranks: readonly RankJourney[];
  /** 次に取る級の行程。全級取得済みなら undefined */
  readonly current: RankJourney | undefined;
  /** 次の一歩。全級取得済みなら undefined */
  readonly nextStep: JourneyStep | undefined;
  /**
   * まだ何も始めていないか（読了・レッスン・挑戦・級がすべて無い）。
   * 登録直後の「黒帯への第一歩」の出し分けに使う
   */
  readonly isFresh: boolean;
}

export interface BuildJourneyInput {
  /** 読了済み章のスラッグ */
  readonly readSlugs: ReadonlySet<string>;
  /** 完了したレッスンのスラッグ */
  readonly completedLessonSlugs: ReadonlySet<string>;
  /** 一度でも挑戦したことのある練習のスラッグ */
  readonly attemptedSlugs: ReadonlySet<PracticeMenuSlug>;
  /** 取得済みの段級位 */
  readonly achievedRankSlugs: readonly RankSlug[];
}

/** 級の「学ぶ」の段を組む */
function buildChapters(
  rank: RankDefinition,
  input: BuildJourneyInput,
): readonly JourneyChapterItem[] {
  return rank.learnChapterSlugs.map((chapterSlug) => {
    const lesson = lessonForChapter(chapterSlug);
    const learnedByLesson =
      lesson !== undefined && input.completedLessonSlugs.has(lesson.slug);
    return {
      chapterSlug,
      lessonSlug: lesson?.slug,
      done: input.readSlugs.has(chapterSlug) || learnedByLesson,
    };
  });
}

/**
 * 級の「練習する」の段を組む
 *
 * 前提章の `practiceLinks` を章の順に集め、同じ練習は最初の 1 つだけ残す
 * （点数表早引きのように、違う範囲で同じ練習へ送る章が並ぶため）。
 * 試験は「認定される」の段なので、ここには含めない。
 */
function buildPractices(
  rank: RankDefinition,
  input: BuildJourneyInput,
): readonly JourneyPracticeItem[] {
  const examSlug = menuTypeToSlug(rank.exam.menuType);
  const seen = new Set<PracticeMenuSlug>();
  const practices: JourneyPracticeItem[] = [];
  for (const chapterSlug of rank.learnChapterSlugs) {
    for (const link of getChapterBySlug(chapterSlug)?.practiceLinks ?? []) {
      if (link.slug === examSlug || seen.has(link.slug)) continue;
      seen.add(link.slug);
      practices.push({
        slug: link.slug,
        variant: link.variant,
        done: input.attemptedSlugs.has(link.slug),
      });
    }
  }
  return practices;
}

/** 級の行程の中で、学ぶ → 練習する → 認定される の順に最初の未了を返す */
function selectStep(journey: RankJourney): JourneyStep {
  const chapter = journey.chapters.find((item) => !item.done);
  if (chapter !== undefined) {
    return chapter.lessonSlug === undefined
      ? { kind: "read", chapterSlug: chapter.chapterSlug }
      : {
          kind: "lesson",
          lessonSlug: chapter.lessonSlug,
          chapterSlug: chapter.chapterSlug,
        };
  }

  const practice = journey.practices.find((item) => !item.done);
  if (practice !== undefined) {
    return { kind: "practice", slug: practice.slug, variant: practice.variant };
  }

  return { kind: "exam", slug: journey.exam.slug };
}

/**
 * 読了・レッスン・挑戦履歴・取得済みの級から、黒帯への道の全体を組む
 * 行程構築
 *
 * 純関数。サーバー（ダッシュボード・道場）からもテストからも読める。
 */
export function buildJourney(input: BuildJourneyInput): Journey {
  const ranks: readonly RankJourney[] = RANK_REGISTRY.map((rank) => ({
    rank,
    status: resolveRankStatus(rank.slug, input.achievedRankSlugs),
    chapters: buildChapters(rank, input),
    practices: buildPractices(rank, input),
    exam: {
      slug: menuTypeToSlug(rank.exam.menuType),
      done: input.achievedRankSlugs.includes(rank.slug),
    },
  }));

  const next = nextRank(input.achievedRankSlugs);
  const current = ranks.find((journey) => journey.rank.slug === next?.slug);

  return {
    ranks,
    current,
    nextStep: current === undefined ? undefined : selectStep(current),
    isFresh:
      input.readSlugs.size === 0 &&
      input.completedLessonSlugs.size === 0 &&
      input.attemptedSlugs.size === 0 &&
      input.achievedRankSlugs.length === 0,
  };
}

/**
 * 行程の 1 段の進み具合（済んだ数 / 全体）
 * 段の進捗
 */
export interface JourneyStageProgress {
  readonly done: number;
  readonly total: number;
}

/** 項目の並びから進み具合を数える */
export function countProgress(
  items: readonly JourneyItem[],
): JourneyStageProgress {
  return {
    done: items.filter((item) => item.done).length,
    total: items.length,
  };
}
