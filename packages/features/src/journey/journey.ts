import {
  getChapterBySlug,
  type CurriculumChapterSlug,
} from "../curriculum/registry";
import { quizLessonBySlug, type QuizLessonSlug } from "../lessons/registry";
import { menuTypeToSlug, type PracticeMenuSlug } from "../practice-menu-types";
import { resolveRankStatus, type RankStatus } from "../ranks/rank-status";
import {
  RANK_REGISTRY,
  nextRank,
  rankBySlug,
  type RankDefinition,
  type RankSlug,
} from "../ranks/registry";

/**
 * 点数計算・黒帯への道 — 段級位ごとの行程と、その中の「次にやること」
 * 黒帯への道
 *
 * @description
 * 段級位（5級 → … → 初段 = 黒帯）を 1 本の道として見せるためのモデル。
 * 級ごとに「学ぶ（レッスン）→ 練習する → 認定される（試験に合格）」の
 * 3 段を持ち、ユーザーのレッスン完了・練習の挑戦履歴・取得済みの級から
 * 各段の進み具合を出す。ダッシュボードの「次にやること」カード・道場の行程表示・
 * 登録直後の最初の一歩が、すべてこの 1 つの計算を読む — 置き場所ごとに
 * 「次」を別々に決めると、ホームと道場で指す先が食い違う。
 *
 * @design 「学んだ」はレッスンの完了
 * 学ぶ段の 1 歩はレッスン（= 教本の章、`/lessons/<slug>`）1 つで、済んだかは
 * レッスンの完了（`lesson_completions`）だけで決める。確認問題を持つレッスンは
 * 問題を最後まで解いた時点で、持たないレッスンは章末のボタンで完了になり、
 * どちらも同じ印として記録される。以前あった「読了」（本人が押すだけの別の印）
 * は廃止し、記録もレッスンの完了へ畳んだ — 同じ章に 2 つの印があると、行程が
 * どちらで進むのかを画面で断り続けることになる。
 *
 * レッスン完了は「回答と解説まで取り組んだ」印で、正解したことの印ではない
 * （間違えても解説を読んで先へ進める）。習得の判定は試験が持つ。
 *
 * 段級位の前提章はすべて確認問題を持つ。前提章を足すときは確認問題も一緒に
 * 用意する — 持たない章だけ確認を経ずに進む歩になる。
 *
 * @design 練習と試験は学ぶ段とは別の役割のまま
 * 統一するのは学ぶ段だけ。練習は読んだ範囲を時間制限つきで反復して定着させる
 * 段、試験は習得を判定する段で、どちらもレッスンには置き換えない。
 *
 * @design 「練習した」は一度でも挑戦したこと — 土俵（slug × バリアント）ごとに
 * 練習の段は「読んだのに触っていない練習」を無くすためのもので、習得の
 * 判定ではない（習得は試験が決める）。チャレンジを 1 回でも終えていれば
 * 済みとする。トレーニングは記録を残さないので数えられない — それで
 * よい。記録に残らない練習を進捗にしないのは、記録の土俵の設計と同じ。
 *
 * 数える単位は記録と同じ土俵 `(slug, variant)`。点数表早引きの
 * 「子・満貫以上」と「親・満貫以上」は別の出題範囲で、章もそれぞれ別の
 * 範囲へ送っている。満貫未満の挑戦があるからといって満貫以上を済みにしない。
 * バリアントを指定しない章のリンク（説明ページでバリアントを選ばせる練習や、
 * 設定を持たない練習）は、その練習にどの土俵でも挑戦していれば済み。
 *
 * @design 学ぶと練習するは章の順に交互に進む
 * 章の `practiceLinks` は「この章まで読めば出題範囲が揃う」位置に付いている
 * （満貫の章のコメント参照）。そこで次の一歩は、級の章を順に歩き、学び終えた
 * 章の直後にその章から送る未挑戦の練習を挟む。未読の章が先にあれば章を
 * 返すので、未学習の範囲を必要とする練習へ早く送ることはない。先に済ませた
 * 章・練習は飛ばす。全部済んだら試験。章ごとの順序はレジストリから導くだけで、
 * 級ごとの手書きの順路は持たない。
 *
 * @design 次の一歩は 1 つだけ
 * 「次に取る級」（{@link nextRank}）の中で最初の未了を 1 つだけ返す。候補を
 * 並べない — 複数の候補が出ると「今やること」ではなく一覧になる。前提章の
 * 読了を受験の条件にはしない（受験資格は `evaluateExamEligibility` が級の
 * 順序だけで決める）ので、経験者は道場や試験ページから直接受けられる。
 * この順序はあくまで案内。
 */

/** 行程の 1 段（学ぶ / 練習する / 認定される）の 1 項目 */
interface JourneyItem {
  /** 済んでいるか */
  readonly done: boolean;
}

/** 学ぶ: レッスン（= 章）1 つ */
export interface JourneyChapterItem extends JourneyItem {
  readonly kind: "chapter";
  readonly chapterSlug: CurriculumChapterSlug;
  /** 確認問題を持つか（今の前提章はすべて持つ） */
  readonly hasQuiz: boolean;
}

/** 練習する: 練習 1 つ（章から送っているバリアント付き） */
export interface JourneyPracticeItem extends JourneyItem {
  readonly kind: "practice";
  readonly slug: PracticeMenuSlug;
  readonly variant: string | undefined;
}

/** 認定される: その級の昇級試験 */
export interface JourneyExamItem extends JourneyItem {
  readonly slug: PracticeMenuSlug;
}

/**
 * 学ぶ・練習するを章の順に交互に並べた行程の 1 項目
 * 行程項目
 */
export type JourneyPathItem = JourneyChapterItem | JourneyPracticeItem;

/**
 * 1 つの級の行程
 * 級の行程
 */
export interface RankJourney {
  readonly rank: RankDefinition;
  readonly status: RankStatus;
  /**
   * 学ぶ → 練習する を章の順に交互に並べた道筋。章の直後にその章から送る
   * 練習が来る。`chapters` / `practices` はこれを段ごとに抜き出したもの
   */
  readonly path: readonly JourneyPathItem[];
  /** 学ぶ: 前提章（カリキュラムの順） */
  readonly chapters: readonly JourneyChapterItem[];
  /**
   * 練習する: 前提章から送っている練習（章の順）。同じ土俵
   * （slug × バリアント）へ送る章が並ぶときは最初の 1 つ
   */
  readonly practices: readonly JourneyPracticeItem[];
  /** 認定される: 昇級試験 */
  readonly exam: JourneyExamItem;
}

/**
 * 次の一歩
 * 次の一歩
 *
 * - `lesson`: レッスン（章）を終える
 * - `practice`: 練習に挑戦する
 * - `exam`: 昇級試験を受ける（学ぶ・練習するが済んだ）
 */
export type JourneyStep =
  | { readonly kind: "lesson"; readonly chapterSlug: CurriculumChapterSlug }
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
   * まだ何も始めていないか（レッスン・挑戦・級がすべて無い）。
   * 登録直後の案内（最初のレッスンへ送るボタン）の出し分けに使う
   */
  readonly isFresh: boolean;
}

/**
 * 一度でも挑戦したことのある練習の土俵 1 つ
 * 挑戦済みの土俵
 *
 * 記録の土俵 `(menu_type, leaderboard_key)` をスラッグで表したもの。
 * `variant` は `leaderboard_key` そのままで、設定を持たない練習は
 * `DEFAULT_VARIANT`。レジストリから外れた古いキーもここでは落とさない —
 * 「どの範囲かは分からないが、その練習に挑戦したことはある」という事実として、
 * バリアントを指定しない章のリンクだけを済みにする（指定のあるリンクは
 * 範囲が一致しないので済みにしない）。
 */
export interface PracticeAttempt {
  readonly slug: PracticeMenuSlug;
  readonly variant: string;
}

export interface BuildJourneyInput {
  /** 完了したレッスン（章）のスラッグ */
  readonly completedLessonSlugs: ReadonlySet<string>;
  /** 一度でも挑戦したことのある練習（土俵ごとに 1 件） */
  readonly attemptedPractices: readonly PracticeAttempt[];
  /** 取得済みの段級位 */
  readonly achievedRankSlugs: readonly RankSlug[];
}

/**
 * 章のリンク先の練習に挑戦済みか
 *
 * リンクがバリアントを指定していれば同じ土俵への挑戦だけ、指定が無ければ
 * その練習へのどの土俵の挑戦でも済み（{@link PracticeAttempt} 参照）。
 */
function hasAttempted(
  attempts: readonly PracticeAttempt[],
  slug: PracticeMenuSlug,
  variant: string | undefined,
): boolean {
  return attempts.some(
    (attempt) =>
      attempt.slug === slug &&
      (variant === undefined || attempt.variant === variant),
  );
}

/** 重複排除のための土俵のキー。スラッグにもバリアントにも使わない区切りで繋ぐ */
function practiceKey(slug: PracticeMenuSlug, variant: string | undefined) {
  return `${slug}\u0000${variant ?? ""}`;
}

/**
 * 章の並びから、学ぶ → 練習する を交互に並べた行程を組む
 * 行程の組み立て
 *
 * 章を順に置き、各章の直後にその章の `practiceLinks` を置く。同じ土俵
 * （slug × バリアント）へ送る章が並ぶときは最初の 1 つだけ残す（点数表早引きの
 * ように、違う範囲で同じ練習へ送る章があるため、範囲が違えば別の項目になる）。
 * 試験は「認定される」の段なので、ここには含めない。
 *
 * 級の行程（{@link buildJourney}）の部品。章の並びを引数で受けるのは、
 * 段級位の定義に無い章の組み合わせでも同じ規則で並ぶことを確かめられる
 * ようにするため。
 *
 * @param chapterSlugs 学ぶ章（カリキュラムの順）
 * @param examSlug その級の試験（練習リンクに現れても行程から除く）
 * @param input レッスンの完了・挑戦履歴
 */
export function buildJourneyPath(
  chapterSlugs: readonly CurriculumChapterSlug[],
  examSlug: PracticeMenuSlug,
  input: BuildJourneyInput,
): readonly JourneyPathItem[] {
  const seen = new Set<string>();
  const path: JourneyPathItem[] = [];
  for (const chapterSlug of chapterSlugs) {
    path.push({
      kind: "chapter",
      chapterSlug,
      hasQuiz: quizLessonBySlug(chapterSlug) !== undefined,
      done: input.completedLessonSlugs.has(chapterSlug),
    });

    for (const link of getChapterBySlug(chapterSlug)?.practiceLinks ?? []) {
      if (link.slug === examSlug) continue;
      const key = practiceKey(link.slug, link.variant);
      if (seen.has(key)) continue;
      seen.add(key);
      path.push({
        kind: "practice",
        slug: link.slug,
        variant: link.variant,
        done: hasAttempted(input.attemptedPractices, link.slug, link.variant),
      });
    }
  }
  return path;
}

/** 行程の中で最初の未了を返す。すべて済んでいれば昇級試験 */
function selectStep(journey: RankJourney): JourneyStep {
  const item = journey.path.find((entry) => !entry.done);
  return item === undefined
    ? { kind: "exam", slug: journey.exam.slug }
    : pathItemToStep(item);
}

/** 行程の 1 項目を、その項目へ進む一歩にする */
function pathItemToStep(item: JourneyPathItem): JourneyStep {
  if (item.kind === "practice") {
    return { kind: "practice", slug: item.slug, variant: item.variant };
  }
  return { kind: "lesson", chapterSlug: item.chapterSlug };
}

/** 進み具合を持たない入力。行程の並びだけを知りたいときに使う */
const NO_PROGRESS: BuildJourneyInput = {
  completedLessonSlugs: new Set(),
  attemptedPractices: [],
  achievedRankSlugs: [],
};

/**
 * レッスンを終えた人に示す、行程の上でそのレッスンの次にある一歩
 * レッスンの次の一歩
 *
 * そのレッスンが属する級の行程で、後ろにある最初の確認問題を持つレッスン。
 * 間にある章の練習は飛ばす — 完了画面は練習を「関連する練習」として別に
 * 並べるので、続けて学ぶ人には次のレッスンの書き出しを見せて送る。後ろに
 * 確認問題を持つレッスンが無ければ直後の項目（章から送る練習・確認問題を
 * 持たないレッスン）で、級の最後の項目なら、その級の昇級試験。
 *
 * ユーザーの進み具合は見ない — レッスンのページは cookie を読まない静的
 * ページで、これはページに焼き込む道筋の順の「次」（次のレッスンの
 * プレビューもこれを描く）。完了を記録できた本人には、記録の Server Action が
 * 返す {@link stepAfterLessonWithProgress} が置き換える。未ログイン・記録の
 * 失敗ではボタン自体を出さないので、実際にこの一歩が使われるのは本人の一歩を
 * 求められなかったとき（全級取得済み等）と、本人の一歩がこれと一致するとき。
 *
 * 級の行程に章が無いレッスン（起きないが型の上では有り得る）は undefined。
 */
export function stepAfterLesson(slug: QuizLessonSlug): JourneyStep | undefined {
  const lesson = quizLessonBySlug(slug);
  const rank = lesson && rankBySlug(lesson.rankSlug);
  if (lesson === undefined || rank === undefined) return undefined;

  const examSlug = menuTypeToSlug(rank.exam.menuType);
  const path = buildJourneyPath(rank.learnChapterSlugs, examSlug, NO_PROGRESS);
  const index = path.findIndex(
    (item) => item.kind === "chapter" && item.chapterSlug === slug,
  );
  if (index === -1) return undefined;

  const next = preferLesson(path.slice(index + 1));
  return next === undefined
    ? { kind: "exam", slug: examSlug }
    : pathItemToStep(next);
}

/**
 * 並びの中で最初の確認問題を持つレッスン。無ければ先頭の項目（練習・確認問題を
 * 持たないレッスン）
 */
function preferLesson(
  items: readonly JourneyPathItem[],
): JourneyPathItem | undefined {
  return (
    items.find((item) => item.kind === "chapter" && item.hasQuiz) ?? items[0]
  );
}

/**
 * レッスンを終えた本人に示す、進み具合を踏まえた次の一歩
 * 進み具合を踏まえたレッスンの次の一歩
 *
 * {@link stepAfterLesson} と同じく「後ろにある最初のレッスン、無ければ直後の
 * 項目」を指すが、済んだ項目は飛ばす。後ろが全部済んでいれば、同じ級の前に
 * 残した項目（飛ばしてきたレッスン・練習）へ戻り、級の項目が全部済んで
 * いれば昇級試験。
 *
 * ダッシュボードの「次にやること」（{@link buildJourney}）とは同じ行程を歩くが、
 * 選び方が 2 点違い、同じ一歩になるとは限らない。
 *
 * - 後ろの項目を前の項目より先に見る。ホームは級の最初の未了を指すが、
 *   レッスンを終えた直後の人には、飛ばしてきた項目より続きを優先する
 *   （続けて学んでいる流れを途切れさせない）
 * - 後ろの中では練習より確認問題を持つレッスンを先に見る（{@link stepAfterLesson} と同じ。
 *   間の練習は完了画面の「関連する練習」に並ぶ）。そのため道筋の順に進めて
 *   いても、子のロン・子のツモを終えて練習が未挑戦なら、ホームは子の練習、
 *   ここは親のロンを指す
 *
 * 後ろが尽きて前へ戻るときだけは、ホームと同じ「最初の未了」を指す。
 *
 * 終えたレッスンの級をすでに取得している（学び直し）なら、その級の試験へは
 * 送らずホームと同じ一歩（次に取る級の最初の未了）を返す。全級取得済みで
 * ホームにも一歩が無ければ undefined — 呼び出し側は道筋の順の一歩
 * （{@link stepAfterLesson}）を使う。
 *
 * このレッスン自身は、記録の直後に呼ばれる前提で済みとして扱う
 * （入力の読み取りが記録より前でも、自分を「次」にしない）。
 *
 * @param slug 終えたレッスン
 * @param input 本人の進み具合
 */
export function stepAfterLessonWithProgress(
  slug: QuizLessonSlug,
  input: BuildJourneyInput,
): JourneyStep | undefined {
  const lesson = quizLessonBySlug(slug);
  const rank = lesson && rankBySlug(lesson.rankSlug);
  if (lesson === undefined || rank === undefined) return undefined;

  const progress: BuildJourneyInput = {
    ...input,
    completedLessonSlugs: new Set([...input.completedLessonSlugs, slug]),
  };
  if (progress.achievedRankSlugs.includes(rank.slug)) {
    return buildJourney(progress).nextStep;
  }

  const examSlug = menuTypeToSlug(rank.exam.menuType);
  const path = buildJourneyPath(rank.learnChapterSlugs, examSlug, progress);
  const index = path.findIndex(
    (item) => item.kind === "chapter" && item.chapterSlug === slug,
  );
  if (index === -1) return undefined;

  const undone = (items: readonly JourneyPathItem[]) =>
    items.filter((item) => !item.done);
  const next =
    preferLesson(undone(path.slice(index + 1))) ??
    undone(path.slice(0, index))[0];
  return next === undefined
    ? { kind: "exam", slug: examSlug }
    : pathItemToStep(next);
}

/** 1 つの級の行程を組む */
function buildRankJourney(
  rank: RankDefinition,
  input: BuildJourneyInput,
): RankJourney {
  const examSlug = menuTypeToSlug(rank.exam.menuType);
  const path = buildJourneyPath(rank.learnChapterSlugs, examSlug, input);
  return {
    rank,
    status: resolveRankStatus(rank.slug, input.achievedRankSlugs),
    path,
    chapters: path.filter((item) => item.kind === "chapter"),
    practices: path.filter((item) => item.kind === "practice"),
    exam: {
      slug: examSlug,
      done: input.achievedRankSlugs.includes(rank.slug),
    },
  };
}

/**
 * レッスンの完了・挑戦履歴・取得済みの級から、黒帯への道の全体を組む
 * 行程構築
 *
 * 純関数。サーバー（ダッシュボード・道場）からもテストからも読める。
 */
export function buildJourney(input: BuildJourneyInput): Journey {
  const ranks: readonly RankJourney[] = RANK_REGISTRY.map((rank) =>
    buildRankJourney(rank, input),
  );

  const next = nextRank(input.achievedRankSlugs);
  const current = ranks.find((journey) => journey.rank.slug === next?.slug);

  return {
    ranks,
    current,
    nextStep: current === undefined ? undefined : selectStep(current),
    isFresh:
      input.completedLessonSlugs.size === 0 &&
      input.attemptedPractices.length === 0 &&
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

/**
 * 級の行程の 3 段（学ぶ・練習する・認定される）
 * 行程の段
 */
export type JourneyStage = "learn" | "practice" | "exam";

/**
 * 級の行程で、いま取り組んでいる段
 * 現在の段
 *
 * 次の一歩（`buildJourney` の `nextStep`）と同じ規則 — 道筋で最初の未了の
 * 項目の段、道筋が済んでいれば試験。学ぶと練習するは章の順に交互に進むので、
 * 「学ぶがすべて済むまで練習しない」わけではない。
 *
 * 試験に合格した級は undefined。学ぶ・練習するを飛ばして合格した経験者の級に
 * 「いま学ぶ段」を示さないため、道筋より先に合否を見る。
 */
export function currentStage(journey: RankJourney): JourneyStage | undefined {
  if (journey.exam.done) return undefined;
  const item = journey.path.find((entry) => !entry.done);
  if (item === undefined) return "exam";
  return item.kind === "chapter" ? "learn" : "practice";
}
