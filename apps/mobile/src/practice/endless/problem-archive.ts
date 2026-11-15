/**
 * 採用された問題を保存 API へ送る（モバイル）
 * 問題保存の送信（モバイル）
 *
 * 実践練習（和了形・聴牌形の点数計算）のストアが、問題を生成できたときに
 * 呼ぶ（ストアのファクトリの `onQuestionAdopted`）。練習を待たせないことを
 * 最優先にし、送信は features の有界キューに預けて取りこぼしを許す
 * （同時 1 件・待ち最大 8 件・1 試行 5 秒・通信失敗と 5xx だけ 1 回送り直す。
 * 永続の outbox は持たない）。保存された件数は出題回数や分布を表さない。
 *
 * 送る側はログイン状態を調べない。保存するのはログイン済みの利用者の出題だけで、
 * 未ログインなら `callMobileApi` が通信せずに `"unauthorized"` を返し、捨てる。
 * `callMobileApi` は中断の signal を受けないので渡さない（5 秒の打ち切りは
 * キューが持ち、打ち切った試行の応答は使わない）。
 *
 * `callMobileApi` の結果と送信キューの結果の対応:
 *
 * | 結果 | 送信キュー |
 * | --- | --- |
 * | 2xx の応答（成功は 204） | 完了 |
 * | 5xx の応答・`"network"`・5 秒の打ち切り | 1 回だけ送り直す |
 * | 4xx・429 の応答・`"unauthorized"`・`"userChanged"`・その他の失敗 | 捨てる |
 *
 * 要求の組み立てと送信の登録はどこで失敗しても例外を外へ出さない。練習の
 * 操作は保存の成否に関わらず同期に終わる。
 */
import {
  archiveSendOutcomeOf,
  MOBILE_PRACTICE_PROBLEMS_API_PATH,
  type PracticeProblemArchiveRequest,
} from "@mahjong-scoring/features/practice/archive/mobile-api";
import {
  agariArchiveRequestOf,
  tenpaiArchiveRequestOf,
} from "@mahjong-scoring/features/practice/archive/archive-request";
import {
  createProblemArchiveQueue,
  type ArchiveSendOutcome,
} from "@mahjong-scoring/features/practice/archive/problem-archive-queue";
import type { ScoreQuestion, TenpaiScoreQuestion } from "@mahjong-scoring/core";

import { callMobileApi } from "../../auth/api-client";

/** 1 件送り、結果を送信キューの結果へ読み替える */
async function sendArchiveRequest(
  request: PracticeProblemArchiveRequest,
): Promise<ArchiveSendOutcome> {
  const result = await callMobileApi(MOBILE_PRACTICE_PROBLEMS_API_PATH, {
    method: "POST",
    body: request,
  });
  if (result instanceof Response) return archiveSendOutcomeOf(result.status);
  return result === "network" ? "retry" : "drop";
}

/** モバイルの保存の送信キュー（アプリ全体で 1 つ） */
const queue = createProblemArchiveQueue<PracticeProblemArchiveRequest>({
  send: sendArchiveRequest,
});

/** 要求を組み立てて送信キューへ入れる。どこで失敗しても投げない */
function enqueueRequest(build: () => PracticeProblemArchiveRequest): void {
  try {
    queue.enqueue(build());
  } catch (error) {
    console.warn("[problem-archive] 送信の登録に失敗した", error);
  }
}

/**
 * 採用された和了形の点数計算の問題を保存へ送る（投げない・待たない）
 * 和了形問題の保存
 *
 * @param question ストアが採用した問題
 */
export function archiveAgariQuestion(question: ScoreQuestion): void {
  enqueueRequest(() => agariArchiveRequestOf(question));
}

/**
 * 採用された聴牌形の点数計算の問題を保存へ送る（投げない・待たない）
 * 聴牌形問題の保存
 *
 * @param question ストアが採用した問題
 */
export function archiveTenpaiQuestion(question: TenpaiScoreQuestion): void {
  enqueueRequest(() => tenpaiArchiveRequestOf(question));
}
