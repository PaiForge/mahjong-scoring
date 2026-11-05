import { z } from "zod";

import type { ChallengeSettings } from "./types";

/**
 * チャレンジの開始時に固定するローカルルール（{@link ChallengeSettings}）の形
 *
 * アプリ向け API の要求・状態の検証（`mobile-api.ts`）と、web の開始の要求の
 * 検証（`lib/challenge/attempt-views.ts`・`lib/mobile-api/challenge.ts`）が同じ
 * 形を読む。設定の項目を足すときはここと `ChallengeSettings` だけを直す
 * （`satisfies` が食い違いを落とす）。
 */
export const challengeSettingsSchema = z.object({
  renfonpaiAs4Fu: z.boolean(),
}) satisfies z.ZodType<ChallengeSettings>;
