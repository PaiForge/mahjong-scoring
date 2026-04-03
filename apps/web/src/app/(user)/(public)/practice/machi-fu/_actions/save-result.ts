'use server';

import type { SaveResultResponse } from '../../_actions/save-practice-result';
import { savePracticeResult } from '../../_actions/save-practice-result';

export type { SaveResultResponse } from '../../_actions/save-practice-result';

export interface SaveMachiFuResultInput {
  readonly correctAnswers: number;
  readonly incorrectAnswers: number;
  readonly timeTaken: number;
}

/**
 * 待ち符ドリルの結果を保存する
 * 待ち符ドリル結果保存
 */
export async function saveMachiFuResult(input: SaveMachiFuResultInput): Promise<SaveResultResponse> {
  return savePracticeResult('machi_fu', 'default', {
    score: input.correctAnswers,
    incorrectAnswers: input.incorrectAnswers,
    timeTaken: input.timeTaken,
  });
}
