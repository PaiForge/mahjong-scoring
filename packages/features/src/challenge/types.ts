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
}
