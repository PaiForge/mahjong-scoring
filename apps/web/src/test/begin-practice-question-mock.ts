import { vi } from "vitest";

import type {
  BeginPracticeQuestionError,
  BeginPracticeQuestionResult,
} from "@/app/(user)/(public)/practice/_actions/begin-practice-question";
import type { ActionResult } from "@/lib/action-types";

/**
 * `beginPracticeQuestion`（無料枠の消費 Server Action）のテスト用スタブ
 * 出題開始モック
 *
 * エンドレス練習の盤面は問題を生成する前にこの Server Action を呼ぶ。
 * 実物は `server-only` のモジュール（DB・cookie）を引くため、盤面を描く
 * テストはこのモックを噛ませる:
 *
 * ```ts
 * vi.mock(
 *   "../../_actions/begin-practice-question",
 *   async () => await import("@/test/begin-practice-question-mock"),
 * );
 * ```
 *
 * 既定は「許可・残り無制限」。上限到達を見たいテストは
 * `beginPracticeQuestion.mockResolvedValue({ success: true, allowed: false, ... })`
 * で上書きする。
 *
 * 同じモジュールの `peekPracticeQuota`（盤面に戻ったときの消費しない
 * 取り直し）も同じ形で用意する。既定は出題と同じ「残り無制限」。
 *
 * このモジュールはテスト専用。
 */

const UNLIMITED = {
  success: true,
  allowed: true,
  remaining: "unlimited",
  limit: "unlimited",
  signedIn: true,
  benefits: [],
} as const;
export const beginPracticeQuestion = vi.fn<
  (
    menu: string,
  ) => Promise<
    ActionResult<BeginPracticeQuestionError, BeginPracticeQuestionResult>
  >
>(async () => UNLIMITED);

export const peekPracticeQuota = vi.fn<
  (
    menu: string,
  ) => Promise<
    ActionResult<BeginPracticeQuestionError, BeginPracticeQuestionResult>
  >
>(async () => UNLIMITED);
