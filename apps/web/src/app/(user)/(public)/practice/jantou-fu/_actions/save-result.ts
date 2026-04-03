'use server';

import type { SaveResultResponse } from '../../_actions/save-practice-result';
import { savePracticeResult } from '../../_actions/save-practice-result';

export type { SaveResultResponse } from '../../_actions/save-practice-result';

export interface SaveJantouFuResultInput {
  readonly correctAnswers: number;
  readonly incorrectAnswers: number;
  readonly timeTaken: number;
}

/**
 * 雀頭符ドリルの結果を保存する
 * 雀頭符ドリル結果保存
 */
export async function saveJantouFuResult(input: SaveJantouFuResultInput): Promise<SaveResultResponse> {
  return savePracticeResult('jantou_fu', 'default', {
    score: input.correctAnswers,
    incorrectAnswers: input.incorrectAnswers,
    timeTaken: input.timeTaken,
  });
}
