/**
 * 出題した問題の保存 API の契約
 * 問題保存APIの契約
 *
 * web とアプリの実践練習（和了形・聴牌形の点数計算）が、採用した問題を送る先。
 * 本文は {@link PracticeProblemArchiveRequest} の JSON で、成功は 204（本文なし）。
 * 400 は不正な本文、401 は未認証、403 は BAN・Origin 不正、429 は上限。
 * 応答に本文を持たないので、応答の形の契約（検証関数）は置かない。
 */
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
