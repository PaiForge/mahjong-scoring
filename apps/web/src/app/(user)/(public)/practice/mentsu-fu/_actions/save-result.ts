'use server';

import type { SaveResultResponse } from '../../_actions/save-practice-result';
import { savePracticeResult } from '../../_actions/save-practice-result';

export type { SaveResultResponse } from '../../_actions/save-practice-result';

export interface SaveMentsuFuResultInput {
  readonly correctAnswers: number;
  readonly incorrectAnswers: number;
  readonly timeTaken: number;
}

/**
 * 面子符ドリルの結果を保存する
 * 面子符ドリル結果保存
 */
export async function saveMentsuFuResult(input: SaveMentsuFuResultInput): Promise<SaveResultResponse> {
  return savePracticeResult('mentsu_fu', 'default', {
    score: input.correctAnswers,
    incorrectAnswers: input.incorrectAnswers,
    timeTaken: input.timeTaken,
  });
}
