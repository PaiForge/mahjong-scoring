import { vi } from "vitest";

/**
 * `submitExamResult`（Server Action）のテスト用スタブ
 * 試験採点アクションモック
 *
 * チャレンジの盤面ファクトリ（`createChallengePlayView`）は練習用の
 * `savePracticeResult` と試験用の `submitExamResult` の両方を参照するため、
 * クライアント側だけを描くテストでは両方のモジュールを解決できないと落ちる。
 * `save-practice-result-mock` と対で噛ませる:
 *
 * ```ts
 * vi.mock(
 *   "@/app/(user)/(public)/exam/_actions/submit-exam-result",
 *   async () => await import("@/test/submit-exam-result-mock"),
 * );
 * ```
 *
 * このモジュールはテスト専用。
 */
export const submitExamResult = vi.fn();
