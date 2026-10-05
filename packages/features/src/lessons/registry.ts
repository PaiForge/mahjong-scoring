import {
  practiceLink,
  type CurriculumChapterSlug,
  type PracticeLink,
} from "../curriculum/registry";
import type { RankSlug } from "../ranks/registry";

/**
 * 確認問題を持つレッスンのレジストリ — 確認問題と完了後の導線の単一の真実のソース
 * 確認問題レッスンレジストリ
 *
 * @description
 * レッスンは教本の章そのもの（`/lessons/<slug>`。一覧と順序は
 * `curriculum/registry.ts`）で、「本文 → 確認問題 → できたことの確認」を 1 本で
 * 通す、時間制限も記録も無い学習の最小単位。黒帯への道の学ぶ段の 1 歩になる。
 * ここに並ぶのは、そのうち確認問題を持つレッスン。問題の数と形は章ごとに、
 * その章で何を確かめるかから決める（features の `lessons/quizzes.ts`）。
 *
 * チャレンジ（制限時間・ミス上限・記録）ともトレーニング（無制限・記録なし）
 * とも別物で、唯一残すのは「完了した」という事実（`lesson_completions`）。
 * これが行程（journey）で「学んだ」の印になる。確認問題を持たないレッスン
 * （基礎・点数記憶術の章）は章末のボタンで完了を記録し、同じ印になる。
 *
 * @design slug は章の slug
 * レッスン = 章なので、ここの slug は `CurriculumChapterSlug` そのもの。
 * `lesson_completions.lesson_slug` も章の slug で、確認問題の有無で記録の
 * 形を分けない。章から独立した題材の確認問題は作らない — 行程の「学ぶ」の
 * 数が章の数と一致しなくなり、進捗の分母が揺れる。
 *
 * @design 子のロンから始める
 * 行程の最初の一歩（登録直後に案内する）は、覚える量が最小の「満貫以上・
 * 子・ロン」の 5 つの点数。子のロンの章は練習を持たない（ロンとツモは同じ
 * 点数の表裏で、片方だけの練習は暗記の単位として不自然 — 章側のコメント
 * 参照）が、確認問題は記録を残さず土俵（記録の比較単位）を持たないため、
 * その理屈の外にある。
 *
 * @design 練習リンクは章と別に持つ
 * 確認問題は練習のチュートリアルにあたり、終えた直後に「同じ形の問題を
 * 本番の練習で解く」へ送る。章の `practiceLinks` は読んだ範囲だけを
 * 出す練習に絞っている（子のロンの章は持たない）が、ここの送り先は
 * 範囲が先へはみ出す練習も指す — 1 章分だけを出す練習が無い章でも、
 * 終えた人を練習の入口に立たせるため。はみ出す分は練習側の出題で初めて
 * 出会い、次のレッスンで学ぶ。確認問題を持たないレッスンは章の
 * `practiceLinks` をそのまま完了後の導線にする。
 */
interface QuizLessonEntry {
  /** 章の slug（URL `/lessons/<slug>`・DB `lesson_completions.lesson_slug`） */
  readonly slug: CurriculumChapterSlug;
  /** 属する段級位。行程のどの級の一歩かを示す */
  readonly rankSlug: RankSlug;
  /** 辞書の名前空間（`lessons.<key>`） */
  readonly messageKey: string;
  /** 完了画面から送る練習。狭い範囲のものから並べる */
  readonly practiceLinks: readonly PracticeLink[];
}

/** 確認問題を持つレッスンのマスタ配列（行程で出会う順に並べる） */
export const QUIZ_LESSON_REGISTRY = [
  {
    slug: "mangan-ko-ron",
    rankSlug: "kyu-5",
    messageKey: "manganKoRon",
    practiceLinks: [
      practiceLink("score-table", "ko_mangan_plus"),
      practiceLink("mangan-score-calculation"),
    ],
  },
  {
    slug: "mangan-ko-tsumo",
    rankSlug: "kyu-5",
    messageKey: "manganKoTsumo",
    practiceLinks: [
      practiceLink("score-table", "ko_mangan_plus"),
      practiceLink("mangan-score-calculation"),
    ],
  },
  {
    slug: "mangan-oya-ron",
    rankSlug: "kyu-5",
    messageKey: "manganOyaRon",
    practiceLinks: [
      practiceLink("score-table", "oya_mangan_plus"),
      practiceLink("mangan-score-calculation"),
    ],
  },
  {
    slug: "mangan-oya-tsumo",
    rankSlug: "kyu-5",
    messageKey: "manganOyaTsumo",
    practiceLinks: [
      practiceLink("score-table", "oya_mangan_plus"),
      practiceLink("mangan-score-calculation"),
    ],
  },
  {
    slug: "yaku",
    rankSlug: "kyu-5",
    messageKey: "yaku",
    // 章の練習のうち「役の翻数」は載せない。5 級の最後のレッスンで後ろに
    // レッスンが無く、完了画面の次の一歩がその練習を指すため、ここに
    // 並べると同じ練習が 2 回出る
    practiceLinks: [practiceLink("han-count"), practiceLink("yaku")],
  },
  {
    slug: "jantou-fu",
    rankSlug: "kyu-4",
    messageKey: "jantouFu",
    practiceLinks: [
      practiceLink("jantou-fu"),
      practiceLink("mentsu-jantou-fu"),
    ],
  },
  {
    slug: "mentsu-fu",
    rankSlug: "kyu-4",
    messageKey: "mentsuFu",
    practiceLinks: [
      practiceLink("mentsu-fu"),
      practiceLink("mentsu-jantou-fu"),
    ],
  },
  {
    slug: "machi-fu",
    rankSlug: "kyu-4",
    messageKey: "machiFu",
    // 面子と雀頭の符の練習は待ちを問わないので、待ちを含む通しの練習へ送る
    practiceLinks: [practiceLink("machi-fu"), practiceLink("total-fu")],
  },
  {
    slug: "tehai-fu",
    rankSlug: "kyu-4",
    messageKey: "tehaiFu",
    // 章の練習のうち「面子と雀頭の符」は載せない。4 級の最後のレッスンで
    // 後ろにレッスンが無く、完了画面の次の一歩がその練習を指すため
    practiceLinks: [practiceLink("total-fu")],
  },
  {
    slug: "chiitoitsu-score",
    rankSlug: "kyu-3",
    messageKey: "chiitoitsuScore",
    // 章に対応する練習は自由練習の七対子絞り込みで、カタログの練習では
    // ないので指せない（導線は説明に出す章本文の CTA が持つ）。表を引く
    // 練習として、25 符の列を含む満貫未満の点数表早引きへ送る
    practiceLinks: [
      practiceLink("score-table", "ko_non_mangan"),
      practiceLink("score-table", "oya_non_mangan"),
    ],
  },
  {
    slug: "pinfu-score",
    rankSlug: "kyu-2",
    messageKey: "pinfuScore",
    // 七対子と同じ理由で、章に対応する自由練習は指せない。20 符・30 符の
    // 列を含む満貫未満の点数表早引きへ送る
    practiceLinks: [
      practiceLink("score-table", "ko_non_mangan"),
      practiceLink("score-table", "oya_non_mangan"),
    ],
  },
  {
    slug: "menzen-mentsu-score",
    rankSlug: "kyu-1",
    messageKey: "menzenMentsuScore",
    // 章に対応する自由練習（門前縛り）は指せない（七対子と同じ理由）。
    // 積み上げて符を出す練習から、符と翻から点数を出す練習へ
    practiceLinks: [
      practiceLink("total-fu"),
      practiceLink("score-calculation"),
    ],
  },
  {
    slug: "furo-score",
    rankSlug: "kyu-1",
    messageKey: "furoScore",
    // 門前の面子手のレッスンと同じ（章に対応する自由練習＝副露縛りは指せない）
    practiceLinks: [
      practiceLink("total-fu"),
      practiceLink("score-calculation"),
    ],
  },
] as const satisfies readonly QuizLessonEntry[];

/** 確認問題を持つレッスンの slug（章の slug の部分集合） */
export type QuizLessonSlug = (typeof QUIZ_LESSON_REGISTRY)[number]["slug"];

/** 確認問題を持つレッスン 1 件の定義（公開型） */
export type QuizLesson = (typeof QUIZ_LESSON_REGISTRY)[number];

/** 確認問題を持つレッスンの slug の配列 */
export const QUIZ_LESSON_SLUGS: readonly QuizLessonSlug[] =
  QUIZ_LESSON_REGISTRY.map((lesson) => lesson.slug);

const quizLessonSlugSet: ReadonlySet<string> = new Set(QUIZ_LESSON_SLUGS);

/**
 * 値が確認問題を持つレッスンの slug かを判定する型ガード
 * 確認問題レッスン判定
 *
 * 確認問題（`lessonQuiz`）を引く前の絞り込みに使う。完了の記録は章の slug
 * なら何でも受けるので、こちらではなく `isCurriculumChapterSlug` で検証する。
 */
export function isQuizLessonSlug(value: unknown): value is QuizLessonSlug {
  return typeof value === "string" && quizLessonSlugSet.has(value);
}

/**
 * 章の slug から、その章の確認問題レッスンの定義を引く
 * 確認問題レッスン取得
 *
 * 確認問題を持たない章・未知の slug なら undefined（章ページは章末の
 * 完了ボタンだけを出す）。
 */
export function quizLessonBySlug(slug: string): QuizLesson | undefined {
  return QUIZ_LESSON_REGISTRY.find((lesson) => lesson.slug === slug);
}
