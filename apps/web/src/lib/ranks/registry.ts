import type { CurriculumChapterSlug } from "@/app/(user)/(public)/learn/_lib/curriculum";
import type { PracticeMenuType } from "@/lib/db/practice-menu-types";

/**
 * 段級位レジストリ — ランク定義の単一の真実のソース
 * 段級位レジストリ
 *
 * @description
 * 段級位（5級〜）の定義と昇級要件をコードで管理する。ランクの追加・
 * 要件の変更はこの配列の編集だけで完結し、DB マイグレーションを必要と
 * しない（DB が持つのは `user_ranks` = 付与記録のみ）。
 *
 * @design ランク定義を DB シードでなくコードに置く理由
 *
 * このリポジトリはマスタデータを一貫してコードのレジストリで管理する
 * （`PRACTICE_MENU_REGISTRY` / `CURRICULUM_REGISTRY` / `PRACTICE_CATALOG`）。
 * 要件の `menuType` を {@link PracticeMenuType} で型付けすることで、
 * 存在しない練習を参照する要件はコンパイル時に弾かれる。DB シード方式だと
 * 「未知の要件はパース時に黙って捨てられ、昇級判定が素通りする」という
 * 実行時の落とし穴が生まれる。
 *
 * @design 昇級要件が「ベストスコア >= minScore」だけで成立する理由
 *
 * ミス許容などのセッションルールは練習レジストリ側
 * （`PRACTICE_MENU_REGISTRY` の `mistakeLimit`）で強制する。例えば昇級試験
 * （mangan_exam）はミス1回で強制終了するため、セッションはミス0〜1でしか
 * 終われず、「ベストスコア >= 合格点」⟺「制限時間内に合格点まで正解した
 * 走行が存在する」が常に成立する。
 *
 * 逆に「ミス上限を緩くして判定側で incorrectAnswers == 0 を要求」しては
 * ならない: `challenge_best_scores` はタプル比較
 * `(score, -incorrect, -time)` で更新されるため、後の「高スコア・多ミス」の
 * 走行が「合格点・ノーミス」の記録を上書きし、合格者が不合格化する。
 */

/**
 * チャレンジのベストスコアが閾値以上であることを要求する昇級要件
 * チャレンジスコア要件
 *
 * `challenge_best_scores` の (menuType, leaderboardKey) のベストスコアが
 * `minScore` 以上なら達成。
 */
export interface ChallengeScoreRequirement {
  readonly type: "challenge_score";
  readonly menuType: PracticeMenuType;
  readonly leaderboardKey: string;
  /**
   * 合格に必要な正解数（制限時間内）
   *
   * 判定はベストスコアとの比較なので、合格点に達した後のミスで終了した走行も
   * 合格になる（10 問正解した直後の 11 問目でミスして終了 → スコア 10 →
   * 合格）。「制限時間内に合格点まで正解した」という条件をそのまま表しており、
   * 意図した挙動。
   */
  readonly minScore: number;
}

/**
 * 昇級要件（要件型の union。新しい要件型はここに足し、評価関数を
 * `lib/db/rank-evaluation.ts` の evaluators に登録する）
 * 昇級要件
 */
export type RankRequirement = ChallengeScoreRequirement;

/**
 * 段級位1件の定義
 * 段級位定義
 */
interface RankDefinitionEntry {
  /** URL・DB（user_ranks.rank_slug）で使う識別子 */
  readonly slug: string;
  /**
   * 昇順の序列。将来の中間段位の挿入に備えて飛び番（10, 20, ...）にする。
   */
  readonly level: number;
  /** すべて満たすと昇級（暗黙の AND） */
  readonly requirements: readonly RankRequirement[];
  /**
   * 受験前に読んでおく教本の章（カリキュラムの表示順で並べる）。
   * 前提章
   *
   * 道場ページが「前提となる教本の章」として表示する。章側の `examSlug`
   * （章末に試験 CTA を出す章）とは向きが違う関係で、互いの逆写像ではない —
   * 試験 CTA は前提知識が揃う最後の章にだけ出すが、前提章はそれより前の
   * 章も含む（5級なら満貫セクションの4章 + 役の章）。
   */
  readonly learnChapterSlugs: readonly CurriculumChapterSlug[];
}

/**
 * 段級位のマスタ配列（level 昇順で並べる）
 *
 * 級は数字が大きいほど下位（5級 → 4級 → … → 初段）。
 */
export const RANK_REGISTRY = [
  {
    // 合格基準: 満貫以上の点数計算ができること
    slug: "kyu-5",
    level: 10,
    requirements: [
      {
        type: "challenge_score",
        menuType: "mangan_exam",
        leaderboardKey: "default",
        // 合格条件: 昇級試験で制限時間以内に10問正解（ミスは1回で終了 —
        // 練習レジストリの mistakeLimit が強制する）
        minScore: 10,
      },
    ],
    learnChapterSlugs: [
      "mangan-ko-ron",
      "mangan-oya-ron",
      "mangan-ko-tsumo",
      "mangan-oya-tsumo",
      "yaku",
    ],
  },
  {
    // 合格基準: 手牌の符が計算できること
    slug: "kyu-4",
    level: 20,
    requirements: [
      {
        type: "challenge_score",
        menuType: "fu_exam",
        leaderboardKey: "default",
        // 合格条件: 昇級試験で制限時間以内に6問正解（ミスは1回で終了 —
        // 練習レジストリの mistakeLimit が強制する）。
        // 5級（10問）より少ないのは1問の重さが違うため: あちらは翻数を
        // 数えて点数を引くだけだが、こちらは副底から待ち符までを積み上げて
        // 切り上げる手数が要る
        minScore: 6,
      },
    ],
    learnChapterSlugs: ["jantou-fu", "mentsu-fu", "machi-fu", "tehai-fu"],
  },
  {
    // 合格基準: 七対子の場合における点数計算ができること
    slug: "kyu-3",
    level: 30,
    requirements: [
      {
        type: "challenge_score",
        menuType: "chiitoitsu_exam",
        leaderboardKey: "default",
        // 合格条件: 昇級試験で制限時間以内に8問正解（ミスは1回で終了 —
        // 練習レジストリの mistakeLimit が強制する）。
        // 1問の中身は5級（10問）と同じ「翻数を数えて点数を引く」だが、
        // 満貫未満は点数の刻みが細かく、選択肢が満貫以上の倍近くある
        // （子ロンで 20 対 10）。1問あたりの読み取りが重いぶん問題数を下げる
        minScore: 8,
      },
    ],
    learnChapterSlugs: ["chiitoitsu-score"],
  },
  {
    // 合格基準: 平和の場合における点数計算ができること
    slug: "kyu-2",
    level: 40,
    requirements: [
      {
        type: "challenge_score",
        menuType: "pinfu_exam",
        leaderboardKey: "default",
        // 合格条件: 昇級試験で制限時間以内に8問正解（ミスは1回で終了 —
        // 練習レジストリの mistakeLimit が強制する）。
        // 3級と同じ8問。1問の中身は「ツモなら20符・ロンなら30符」の
        // 場合分けが1つ増えるぶんだけ重いが、そこは級が1つ上がったぶんの
        // 難度差として吸収する（問題数は揃え、扱う役だけを進める）
        minScore: 8,
      },
    ],
    learnChapterSlugs: ["pinfu-score"],
  },
] as const satisfies readonly RankDefinitionEntry[];

/** 段級位スラッグ */
export type RankSlug = (typeof RANK_REGISTRY)[number]["slug"];

/** 段級位1件の定義（公開型） */
export type RankDefinition = (typeof RANK_REGISTRY)[number];

/** 全段級位スラッグの配列（level 昇順） */
export const RANK_SLUGS: readonly RankSlug[] = RANK_REGISTRY.map(
  (rank) => rank.slug,
);

const rankSlugSet: ReadonlySet<string> = new Set(RANK_SLUGS);

/** 値が有効な段級位スラッグかを判定する型ガード */
export function isRankSlug(value: string): value is RankSlug {
  return rankSlugSet.has(value);
}

/**
 * 達成済みスラッグの中で最上位（level 最大）のランク定義を返す
 * 最上位段級位取得
 *
 * マイページ等で「現在の段級位」を表示するのに使う。未達成なら undefined。
 */
export function highestRank(
  slugs: readonly RankSlug[],
): RankDefinition | undefined {
  const achieved = new Set<string>(slugs);
  // RANK_REGISTRY は level 昇順のため、後ろから最初に見つかったものが最上位
  return [...RANK_REGISTRY].reverse().find((rank) => achieved.has(rank.slug));
}

/**
 * 次に目指す段級位（level 昇順で最初の未達成ランク）を返す
 * 次の段級位取得
 *
 * 道場ページが「次の目標」を表示するのに使う。全ランク達成済みなら
 * undefined（道場は「新しい段級位は準備中」を出す）。
 */
export function nextRank(
  slugs: readonly RankSlug[],
): RankDefinition | undefined {
  const achieved = new Set<string>(slugs);
  return RANK_REGISTRY.find((rank) => !achieved.has(rank.slug));
}

/**
 * ある練習を昇級試験として要求しているランクを返す
 * 試験対応ランク取得
 *
 * 教本章末の「昇級試験へ」CTA が、試験（練習）からランク名・合格基準を
 * 逆引きするのに使う。どのランクの要件にも含まれない練習なら undefined。
 */
export function rankRequiringMenu(menuType: string):
  | {
      readonly rank: RankDefinition;
      readonly requirement: ChallengeScoreRequirement;
    }
  | undefined {
  for (const rank of RANK_REGISTRY) {
    for (const requirement of rank.requirements) {
      if (
        requirement.type === "challenge_score" &&
        requirement.menuType === menuType
      ) {
        return { rank, requirement };
      }
    }
  }
  return undefined;
}
