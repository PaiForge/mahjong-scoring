/**
 * 採用された問題を保存 API へ送る（web）
 * 問題保存の送信（web）
 *
 * 実践練習（和了形・聴牌形の点数計算）のストアが、問題を生成できたときに
 * 呼ぶ（ストアのファクトリの `onQuestionAdopted`）。練習を待たせないことを
 * 最優先にし、送信は features の有界キューに預けて取りこぼしを許す
 * （同時 1 件・待ち最大 8 件・1 試行 5 秒・通信失敗と 5xx だけ 1 回送り直す。
 * 永続の outbox は持たない）。保存された件数は出題回数や分布を表さない。
 *
 * **Server Action にせず、Route Handler（`POST /api/practice-problems`）へ
 * `fetch` で送る。** Next.js はクライアントからの Server Action を 1 つずつ
 * 送って待つ（並べて送らない）。保存を Server Action にすると、保存が遅い間は
 * 次の問題の前に呼ぶ回数確認（これも Server Action）がその後ろに並び、次の
 * 問題が出なくなる。`fetch` なら Server Action の列に入らない。
 *
 * 送る側はログイン状態を調べない。保存するのはログイン済みの利用者の出題だけで、
 * 未ログインの要求は 401 で返り、送り直さずに捨てる（匿名の出題は各練習 1 問/日
 * なので、要求はほとんど増えない）。
 *
 * 応答と送信キューの結果の対応:
 *
 * | 応答 | 結果 |
 * | --- | --- |
 * | 2xx（成功は 204） | 完了 |
 * | 5xx・通信失敗（`fetch` の拒否）・5 秒の打ち切り | 1 回だけ送り直す |
 * | 400・401・403・429 などその他 | 捨てる |
 *
 * 要求の組み立て（直列化を含む）と送信の登録はどこで失敗しても例外を外へ
 * 出さない。練習の操作（`generateNewQuestion` 等）は保存の成否に関わらず
 * 同期に終わる。
 */
import {
  archiveSendOutcomeOf,
  PRACTICE_PROBLEMS_API_PATH,
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

/** 送る本文（JSON 文字列）を 1 件送り、結果を送信キューの結果へ読み替える */
async function sendArchiveBody(
  body: string,
  signal: AbortSignal,
): Promise<ArchiveSendOutcome> {
  try {
    const response = await fetch(PRACTICE_PROBLEMS_API_PATH, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal,
    });
    return archiveSendOutcomeOf(response.status);
  } catch {
    return "retry";
  }
}

/**
 * web の保存の送信キュー（アプリ全体で 1 つ）
 *
 * 本文は登録の時点で JSON にして持つ。直列化の失敗を登録の側で拾い、
 * 送り直しで同じ本文を使うため。
 */
const queue = createProblemArchiveQueue<string>({ send: sendArchiveBody });

/** 要求を組み立てて送信キューへ入れる。どこで失敗しても投げない */
function enqueueRequest(build: () => PracticeProblemArchiveRequest): void {
  try {
    queue.enqueue(JSON.stringify(build()));
  } catch (error) {
    console.warn("problem archive enqueue failed", error);
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
