import {
  MOBILE_PRACTICE_QUOTA_BEGIN_API_PATH,
  mobilePracticeQuotaApiUrl,
  parseMobilePracticeQuotaResponse,
  type MobilePracticeQuotaResponse,
} from "@mahjong-scoring/features/billing/mobile-api";
import type { QuotaMenu } from "@mahjong-scoring/features/quota/limits";

import { requestPlanApi, type PlanApiResult } from "../../billing/plan-api";

/**
 * 1 問始める前に、ログイン中の回数制限の枠を 1 つ消費する
 * 出題開始
 *
 * web と同じ表で数える（web とアプリで 1 日の枠は 1 つ）。ユーザー名を
 * 決めていなければ `usernameRequired`。送る名義は `userId` に限る（`asUser`）。
 */
export function beginPracticeQuota(
  userId: string,
  menu: QuotaMenu,
): Promise<PlanApiResult<MobilePracticeQuotaResponse>> {
  return requestPlanApi(
    MOBILE_PRACTICE_QUOTA_BEGIN_API_PATH,
    { method: "POST", body: { menu }, asUser: userId },
    parseMobilePracticeQuotaResponse,
  );
}

/**
 * ログイン中の今日の残りと特典を消費せずに読む
 * 残数問い合わせ
 */
export function peekPracticeQuota(
  userId: string,
  menu: QuotaMenu,
): Promise<PlanApiResult<MobilePracticeQuotaResponse>> {
  return requestPlanApi(
    mobilePracticeQuotaApiUrl(menu),
    { asUser: userId },
    parseMobilePracticeQuotaResponse,
  );
}
