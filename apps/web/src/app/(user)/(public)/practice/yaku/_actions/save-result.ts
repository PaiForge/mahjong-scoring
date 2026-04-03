'use server';

import type { SaveResultResponse } from '../../_actions/save-practice-result';
import { savePracticeResult } from '../../_actions/save-practice-result';

export type { SaveResultResponse } from '../../_actions/save-practice-result';

export interface SaveYakuResultInput {
  readonly correctAnswers: number;
  readonly incorrectAnswers: number;
  readonly timeTaken: number;
}

/**
 * 役ドリルの結果を保存する
 * 役ドリル結果保存
 */
export async function saveYakuResult(input: SaveYakuResultInput): Promise<SaveResultResponse> {
  return savePracticeResult('yaku', 'default', {
    score: input.correctAnswers,
    incorrectAnswers: input.incorrectAnswers,
    timeTaken: input.timeTaken,
  });
}
