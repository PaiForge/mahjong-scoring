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
  /** 合格に必要な正解数（制限時間内） */
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
