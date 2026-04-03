'use server';

import type { SaveResultResponse } from '../../_actions/save-practice-result';
import { savePracticeResult } from '../../_actions/save-practice-result';

export type { SaveResultResponse } from '../../_actions/save-practice-result';

export interface SaveTehaiFuResultInput {
  readonly correctAnswers: number;
  readonly incorrectAnswers: number;
  readonly timeTaken: number;
}

/**
 * 手牌符ドリルの結果を保存する
 * 手牌符ドリル結果保存
 */
export async function saveTehaiFuResult(input: SaveTehaiFuResultInput): Promise<SaveResultResponse> {
  return savePracticeResult('tehai_fu', 'default', {
    score: input.correctAnswers,
    incorrectAnswers: input.incorrectAnswers,
    timeTaken: input.timeTaken,
  });
}
