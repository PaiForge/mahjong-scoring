import {
  getChapterBySlug,
  type CurriculumChapterSlug,
} from "../curriculum/registry";
import {
  lessonBySlug,
  lessonForChapter,
  type LessonSlug,
} from "../lessons/registry";
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
 * 級ごとに「学ぶ（章 / レッスン）→ 練習する → 認定される（試験に合格）」の
 * 3 段を持ち、ユーザーの読了・レッスン完了・練習の挑戦履歴・取得済みの級から
 * 各段の進み具合を出す。ダッシュボードの「次にやること」カード・道場の行程表示・
 * 登録直後の最初の一歩が、すべてこの 1 つの計算を読む — 置き場所ごとに
 * 「次」を別々に決めると、ホームと道場で指す先が食い違う。
 *
 * @design 「学んだ」はレッスンの完了
 * 学ぶ段の 1 歩は、どの章でも「説明を読む → 確認問題に答える → 完了」の
 * レッスンに揃える。レッスンのある章は、そのレッスンを終えた印
 * （`lesson_completions`）だけで「学んだ」とし、章の読了（`learn_chapter_reads`）
 * では進めない。読了は本人が押すだけの印で、読了とレッスン完了の両方を
 * 完了条件にすると、同じ「学ぶ」の段に確認問題を経る歩と経ない歩が混ざる。
 * 読了は教本側の記録（目次のチェック・教本の続き）として別に残る。
 *
 * レッスン完了は「回答と解説まで取り組んだ」印で、正解したことの印ではない
 * （間違えても解説を読んで先へ進める）。習得の判定は試験が持つ。
 *
 * 段級位の前提章はすべてレッスンを持つ。レッスンの無い章を読了で「学んだ」と
 * する分岐（`lessonSlug` が無い章）は、レッスンを用意する前の章を前提章に
 * 置いたときの受け皿で、今の前提章では通らない。レッスンの無い前提章を
 * 足すと、その章だけ確認問題を経ずに進む歩になるので、章とレッスンは一緒に
 * 足す。読了者がすでにいる章にレッスンを足すときは、それまでの読了を
 * 引き継ぐデータ移行（その章の読了者にレッスン完了を付ける）を同じ変更に
 * 含めること — 含めないと、読了で学んだことになっていた人の進捗が後退する
 * （`drizzle/*_backfill_*_lesson_completion*.sql`）。
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

/** 学ぶ: 章 1 つ。レッスンがあればレッスンで、無ければ章を読んで学ぶ */
export interface JourneyChapterItem extends JourneyItem {
  readonly kind: "chapter";
  readonly chapterSlug: CurriculumChapterSlug;
  /** この章を学ぶレッスン。無ければ章を読む（今の前提章はすべて持つ） */
  readonly lessonSlug: LessonSlug | undefined;
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
   * 登録直後の案内（最初のレッスンへ送る一文とボタン）の出し分けに使う
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
  /** 読了済み章のスラッグ */
  readonly readSlugs: ReadonlySet<string>;
  /** 完了したレッスンのスラッグ */
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
 * @param input 読了・レッスン・挑戦履歴
 */
export function buildJourneyPath(
  chapterSlugs: readonly CurriculumChapterSlug[],
  examSlug: PracticeMenuSlug,
  input: BuildJourneyInput,
): readonly JourneyPathItem[] {
  const seen = new Set<string>();
  const path: JourneyPathItem[] = [];
  for (const chapterSlug of chapterSlugs) {
    const lesson = lessonForChapter(chapterSlug);
    path.push({
      kind: "chapter",
      chapterSlug,
      lessonSlug: lesson?.slug,
      // レッスンのある章はレッスンの完了だけ。読了で進むのはレッスンの
      // 無い章だけ（モジュールの TSDoc 参照）
      done:
        lesson === undefined
          ? input.readSlugs.has(chapterSlug)
          : input.completedLessonSlugs.has(lesson.slug),
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
  return item.lessonSlug === undefined
    ? { kind: "read", chapterSlug: item.chapterSlug }
    : {
        kind: "lesson",
        lessonSlug: item.lessonSlug,
        chapterSlug: item.chapterSlug,
      };
}

/** 進み具合を持たない入力。行程の並びだけを知りたいときに使う */
const NO_PROGRESS: BuildJourneyInput = {
  readSlugs: new Set(),
  completedLessonSlugs: new Set(),
  attemptedPractices: [],
  achievedRankSlugs: [],
};

/**
 * レッスンを終えた人に示す、行程の上でそのレッスンの次にある一歩
 * レッスンの次の一歩
 *
 * そのレッスンが属する級の行程で、後ろにある最初のレッスン。間にある
 * 章の練習は飛ばす — 完了画面は練習を「関連する練習」として別に並べるので、
 * 続けて学ぶ人には次のレッスンの書き出しを見せて送る。後ろにレッスンが
 * 無ければ直後の項目（章から送る練習・レッスンの無い章）で、級の最後の
 * 項目なら、その級の昇級試験。
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
export function stepAfterLesson(slug: LessonSlug): JourneyStep | undefined {
  const lesson = lessonBySlug(slug);
  const rank = lesson && rankBySlug(lesson.rankSlug);
  if (lesson === undefined || rank === undefined) return undefined;

  const examSlug = menuTypeToSlug(rank.exam.menuType);
  const path = buildJourneyPath(rank.learnChapterSlugs, examSlug, NO_PROGRESS);
  const index = path.findIndex(
    (item) => item.kind === "chapter" && item.lessonSlug === slug,
  );
  if (index === -1) return undefined;

  const next = preferLesson(path.slice(index + 1));
  return next === undefined
    ? { kind: "exam", slug: examSlug }
    : pathItemToStep(next);
}

/** 並びの中で最初のレッスン。無ければ先頭の項目（練習・レッスンの無い章） */
function preferLesson(
  items: readonly JourneyPathItem[],
): JourneyPathItem | undefined {
  return (
    items.find(
      (item) => item.kind === "chapter" && item.lessonSlug !== undefined,
    ) ?? items[0]
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
 * - 後ろの中では練習よりレッスンを先に見る（{@link stepAfterLesson} と同じ。
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
  slug: LessonSlug,
  input: BuildJourneyInput,
): JourneyStep | undefined {
  const lesson = lessonBySlug(slug);
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
    (item) => item.kind === "chapter" && item.lessonSlug === slug,
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
 * 読了・レッスン・挑戦履歴・取得済みの級から、黒帯への道の全体を組む
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
      input.readSlugs.size === 0 &&
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
