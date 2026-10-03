import type { CurriculumChapterSlug } from "../curriculum/registry";
import type { RankSlug } from "../ranks/registry";

/**
 * レッスンレジストリ — レッスン定義の単一の真実のソース
 * レッスンレジストリ
 *
 * @description
 * レッスンは「短い説明 → ヒント付きの確認問題 3 問 → できたことの確認」を
 * 1 本で通す、時間制限も記録も無い学習の最小単位。教本の章 1 つを数分で
 * 体験できる形に圧縮したもので、「黒帯への道」の最初の一歩として登録直後の
 * ユーザーに出す。章を読み終えるまでの距離が遠く感じる人に、まず 1 つ
 * 覚えて確かめる体験を先に渡す。
 *
 * チャレンジ（制限時間・ミス上限・記録）ともトレーニング（無制限・記録なし）
 * とも別物で、唯一残すのは「完了した」という事実（`lesson_completions`）。
 * これが行程（journey）で「学んだ」の印になる。
 *
 * @design 章と 1 : 0..1
 * レッスンは必ず 1 つの章に対応し、その章を「学んだ」ことにする代わりの
 * 道になる（章の読了と同じ印）。章の内容を 3 問に切り出すので、章から
 * 独立した題材のレッスンは作らない — 行程の「学ぶ」の数が章の数と一致
 * しなくなり、進捗の分母が揺れる。
 *
 * @design 子のロンだけで始める理由
 * カリキュラムは「子のロン」の章に練習を付けていない（ロンとツモは同じ点数の
 * 表裏で、片方だけの練習は暗記の単位として不自然 — 章側のコメント参照）。
 * レッスンは記録を残さない一回きりの体験で、土俵（記録の比較単位）を持たない
 * ため、その理屈の外にある。最初の一歩は覚える量が最小の「満貫以上・子・
 * ロン」の 5 つの点数に絞る。
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
