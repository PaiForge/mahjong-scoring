import type { CompletedMentsu } from "@pai-forge/riichi-mahjong";

/**
 * 面子の符計算問題
 * 面子符問題
 */
export interface MentsuFuQuestion {
  readonly id: string;
  readonly mentsu: CompletedMentsu;
  readonly answer: number;
  readonly explanation: string;
}
