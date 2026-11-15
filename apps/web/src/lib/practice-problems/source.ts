import { MOBILE_APP_PLATFORMS } from "@mahjong-scoring/features/app-version/mobile-api";

/**
 * 保存した問題の由来（どの入口から届いたか）
 *
 * web の入口は `web`、アプリの入口は要求の `X-App-Platform`（`ios` / `android`）。
 * 表 `practice_problems` の CHECK もこの定数から組み立てる。
 */
export const PRACTICE_PROBLEM_SOURCES = [
  "web",
  ...MOBILE_APP_PLATFORMS,
] as const;

/**
 * 保存した問題の由来
 * 問題保存由来
 */
export type PracticeProblemSource = (typeof PRACTICE_PROBLEM_SOURCES)[number];
