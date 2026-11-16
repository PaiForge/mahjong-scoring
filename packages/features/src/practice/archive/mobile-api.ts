/**
 * 出題した問題の保存 API の契約
 * 問題保存APIの契約
 *
 * web とアプリの実践練習（和了形・聴牌形の点数計算）が、採用した問題を送る先。
 * 本文は {@link PracticeProblemArchiveRequest} の JSON で、成功は 204（本文なし）。
 * 400 は不正な本文、403 は BAN・Origin 不正、429 は上限。未認証はアプリの API が
 * 401、web の API は何も保存せずに 204（web は未ログインでも出題のたびに送るので、
 * 401 にするとブラウザのコンソールへ通信エラーが残る）。
 * 応答に本文を持たないので、応答の形の契約（検証関数）は置かない。
 */
import type { ArchiveSendOutcome } from "./problem-archive-queue";

export type { PracticeProblemArchiveRequest } from "@mahjong-scoring/core";

/**
 * アプリ向け API のパスの接頭辞（サイトの origin からの相対）
 * アプリAPI接頭辞
 *
 * 版を URL に持つのは、配布済みのアプリを強制的に更新できないため。
 */
const MOBILE_API_PREFIX = "/api/mobile/v1";

/**
 * 出題した問題を保存する web の API のパス（cookie 認証・Origin 検証）
 * 問題保存APIパス
 */
export const PRACTICE_PROBLEMS_API_PATH = "/api/practice-problems";

/**
 * 出題した問題を保存するアプリ向け API のパス（Bearer 認証）
 * アプリ問題保存APIパス
 */
export const MOBILE_PRACTICE_PROBLEMS_API_PATH = `${MOBILE_API_PREFIX}/practice-problems`;

/**
 * 保存 API の応答のステータスを送信キューの結果へ読み替える
 * 問題保存応答の読み替え
 *
 * web とアプリで同じ基準にする。
 *
 * | ステータス | 結果 | 理由 |
 * | --- | --- | --- |
 * | 2xx | `"done"` | 保存できた（成功は 204） |
 * | 5xx | `"retry"` | サーバーの一時的な失敗。キューが 1 回だけ送り直す |
 * | それ以外（400・401・403・429 等） | `"drop"` | 送り直しても結果が変わらない。429 も練習を止めないため捨てる |
 *
 * 通信の失敗（応答が得られない）は呼び出し側が `"retry"` にする。
 *
 * @param status HTTP ステータス
 */
export function archiveSendOutcomeOf(status: number): ArchiveSendOutcome {
  if (status >= 200 && status < 300) return "done";
  if (status >= 500) return "retry";
  return "drop";
}
