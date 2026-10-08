import type {
  JantouFuQuestion,
  MachiFuQuestion,
  MentsuFuQuestion,
  MentsuJantouFuQuestion,
  TotalFuQuestion,
  YakuQuestion,
  YakuHanQuestion,
  ScoreTableQuestion,
  ScoreQuestion,
} from "@mahjong-scoring/core";
import type { PracticeMenuType } from "@mahjong-scoring/features/practice-menu-types";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

/** サーバーが保持する出題。正解込みの値は回答確定前に公開しない。 */
export type ChallengeQuestion =
  | JantouFuQuestion
  | MachiFuQuestion
  | MentsuFuQuestion
  | MentsuJantouFuQuestion
  | TotalFuQuestion
  | YakuQuestion
  | YakuHanQuestion
  | ScoreTableQuestion
  | ScoreQuestion;
/** 開始時に固定するローカルルール。試験では使わない。 */
export interface ChallengeSettings {
  readonly renfonpaiAs4Fu: boolean;
}
/** DBに保管する挑戦の状態。クライアントからこの構造を受け取らない。 */
export interface ChallengeState {
  readonly menuType: PracticeMenuType;
  readonly variant: string;
  readonly settings: ChallengeSettings;
  readonly question: ChallengeQuestion;
  readonly sequence: number;
  readonly score: number;
  readonly incorrectAnswers: number;
  readonly elapsedMs: number;
  readonly resumedAt: number;
  readonly paused: boolean;
  readonly answerAfter: number;
  readonly createdAt: number;
  /**
   * 最後に受け付けた回答。応答が通信で失われた再送に、同じ応答を
   * 組み直して返すために持つ。最初の回答までは無い
   */
  readonly lastAnswer?: ChallengeLastAnswer;
  /** 確定の結果。確定済みの挑戦への再送に同じ結果を返すために持つ */
  readonly outcome?: ChallengeOutcome;
}

/**
 * 受け付けた回答と、その応答を組み直すための値
 * 最後の回答
 *
 * 次の問題は持たない — 再送を受け付けるのは直前の 1 問だけ（`sequence` が
 * 今の 1 つ前）で、そのとき次の問題は行の `question` のままだから。
 */
export interface ChallengeLastAnswer {
  /** 回答した問題の番号（受け付けた時点の `sequence`） */
  readonly sequence: number;
  /** 受け取った回答。JSON に直した形で持ち、再送と比べる */
  readonly answer: unknown;
  readonly correct: boolean;
  /** 回答した問題（正解込み。受け付けた後なので開示してよい） */
  readonly answered: ChallengeQuestion;
  /** 採点時点の経過時間 */
  readonly elapsedMs: number;
}

/**
 * 挑戦を確定した結果
 * 確定結果
 *
 * - `recorded` — 練習の成績を記録した
 * - `graded` — 昇級試験の合否を判定した（付与した段級位。無ければ空）
 * - `unrecorded` — 1 問も回答せずに終わり、何も記録しなかった
 */
export type ChallengeOutcome =
  | { readonly kind: "recorded"; readonly challengeResultId: string }
  | { readonly kind: "graded"; readonly grantedRanks: readonly RankSlug[] }
  | { readonly kind: "unrecorded" };
