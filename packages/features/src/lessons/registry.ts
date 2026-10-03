import type { CurriculumChapterSlug } from "../curriculum/registry";
import type { RankSlug } from "../ranks/registry";

/**
 * レッスンレジストリ — レッスン定義の単一の真実のソース
 * レッスンレジストリ
 *
 * @description
 * レッスンは「短い説明 → ヒント付きの確認問題 → できたことの確認」を
 * 1 本で通す、時間制限も記録も無い学習の最小単位。教本の章 1 つを数分で
 * 体験できる形に圧縮したもので、「黒帯への道」の学ぶ段の 1 歩になる。
 * 問題の数と形は章ごとに、その章で何を確かめるかから決める（features の
 * `lessons/quizzes.ts`）。
 *
 * チャレンジ（制限時間・ミス上限・記録）ともトレーニング（無制限・記録なし）
 * とも別物で、唯一残すのは「完了した」という事実（`lesson_completions`）。
 * これが行程（journey）で「学んだ」の印になる。
 *
 * @design 章と 1 : 0..1
 * レッスンは必ず 1 つの章に対応し、その章を「学んだ」ことにする代わりの
 * 道になる（章の読了と同じ印）。章の内容を数問に切り出すので、章から
 * 独立した題材のレッスンは作らない — 行程の「学ぶ」の数が章の数と一致
 * しなくなり、進捗の分母が揺れる。
 *
 * @design 子のロンから始める
 * 行程の最初の一歩（登録直後に案内する）は、覚える量が最小の「満貫以上・
 * 子・ロン」の 5 つの点数。子のロンの章は練習を持たない（ロンとツモは同じ
 * 点数の表裏で、片方だけの練習は暗記の単位として不自然 — 章側のコメント
 * 参照）が、レッスンは記録を残さず土俵（記録の比較単位）を持たないため、
 * その理屈の外にある。
 */
interface LessonDefinitionEntry {
  /** URL（`/lessons/<slug>`）・DB（lesson_completions.lesson_slug）で使う識別子 */
  readonly slug: string;
  /** 対応する教本の章。完了するとこの章を「学んだ」ことになる */
  readonly chapterSlug: CurriculumChapterSlug;
  /** 属する段級位。行程のどの級の一歩かを示す */
  readonly rankSlug: RankSlug;
  /** 辞書の名前空間（`lessons.<key>`） */
  readonly messageKey: string;
}

/** レッスンのマスタ配列（行程で出会う順に並べる） */
export const LESSON_REGISTRY = [
  {
    slug: "mangan-ko-ron",
    chapterSlug: "mangan-ko-ron",
    rankSlug: "kyu-5",
    messageKey: "manganKoRon",
  },
  {
    slug: "mangan-ko-tsumo",
    chapterSlug: "mangan-ko-tsumo",
    rankSlug: "kyu-5",
    messageKey: "manganKoTsumo",
  },
  {
    slug: "mangan-oya-ron",
    chapterSlug: "mangan-oya-ron",
    rankSlug: "kyu-5",
    messageKey: "manganOyaRon",
  },
  {
    slug: "mangan-oya-tsumo",
    chapterSlug: "mangan-oya-tsumo",
    rankSlug: "kyu-5",
    messageKey: "manganOyaTsumo",
  },
  {
    slug: "yaku",
    chapterSlug: "yaku",
    rankSlug: "kyu-5",
    messageKey: "yaku",
  },
] as const satisfies readonly LessonDefinitionEntry[];

/** レッスンスラッグ */
export type LessonSlug = (typeof LESSON_REGISTRY)[number]["slug"];

/** レッスン 1 件の定義（公開型） */
export type LessonDefinition = (typeof LESSON_REGISTRY)[number];

/** 全レッスンスラッグの配列 */
export const LESSON_SLUGS: readonly LessonSlug[] = LESSON_REGISTRY.map(
  (lesson) => lesson.slug,
);

const lessonSlugSet: ReadonlySet<string> = new Set(LESSON_SLUGS);

/**
 * 値が有効なレッスンスラッグかを判定する型ガード
 * レッスンスラッグ判定
 *
 * Server Action が URL 由来の文字列を検証するのに使う。
 */
export function isLessonSlug(value: unknown): value is LessonSlug {
  return typeof value === "string" && lessonSlugSet.has(value);
}

/**
 * スラッグからレッスンの定義を引く
 * レッスン取得
 *
 * 未知の slug なら undefined。
 */
export function lessonBySlug(slug: string): LessonDefinition | undefined {
  return LESSON_REGISTRY.find((lesson) => lesson.slug === slug);
}

/**
 * ある章に対応するレッスンを返す
 * 章のレッスン
 *
 * 行程が「この章はレッスンで学べるか」を引くのに使う。章にレッスンが
 * 無ければ undefined（章を読むのが唯一の道）。
 */
export function lessonForChapter(
  chapterSlug: CurriculumChapterSlug,
): LessonDefinition | undefined {
  return LESSON_REGISTRY.find((lesson) => lesson.chapterSlug === chapterSlug);
}

/**
 * 完了したレッスンが「学んだ」ことにする章の集合を返す
 * レッスンで学んだ章
 *
 * 行程（journey）の外で「章を読む位置」を決めるとき（ダッシュボードの
 * 教本の続き）に、読了と合わせて使う。レッスンで学んだ章を読み直せとは
 * 言わないための写像で、章を読んだ印（`learn_chapter_reads`）にはしない。
 * 未知のレッスンスラッグは無視する。
 *
 * @param completedLessonSlugs 完了したレッスンのスラッグ
 */
export function chaptersLearnedByLessons(
  completedLessonSlugs: ReadonlySet<string>,
): ReadonlySet<CurriculumChapterSlug> {
  return new Set(
    LESSON_REGISTRY.filter((lesson) =>
      completedLessonSlugs.has(lesson.slug),
    ).map((lesson) => lesson.chapterSlug),
  );
}
