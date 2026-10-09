import "server-only";

import type { NextResponse } from "next/server";
import { z } from "zod";

import {
  MOBILE_LESSON_COMPLETIONS_MAX,
  type MobileCompleteLessonsResponse,
  type MobileProgressResponse,
} from "@mahjong-scoring/features/challenge/mobile-api";

import { getJourneyInputOf } from "../journey/progress";
import {
  partitionLessonSlugs,
  recordLessonCompletions,
} from "../lessons/record-completions";

import { authorizeMobileRequest } from "./auth";
import { parseMobileBody } from "./request";
import { mobileJson, mobileServerError } from "./response";

const completeLessonsSchema = z.object({
  slugs: z.array(z.string().max(100)).max(MOBILE_LESSON_COMPLETIONS_MAX),
});

/**
 * 本人の進み具合（黒帯への道の材料）を返す（アプリ向け）
 * 進み具合API（アプリ向け）
 *
 * web の道場・ダッシュボードと同じ 3 つ（取得済みの級・レッスンの完了・
 * 挑戦した練習）。アプリはこれと端末の未送信分・ゲストの記録を合わせて
 * 行程を組む。
 */
export async function handleReadProgress(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readMobileProgress");
  if (!auth.ok) return auth.response;
  try {
    const input = await getJourneyInputOf(auth.user.id);
    return mobileJson<MobileProgressResponse>({
      completedLessonSlugs: [...input.completedLessonSlugs],
      attemptedPractices: input.attemptedPractices,
      achievedRankSlugs: input.achievedRankSlugs,
    });
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/progress",
      "読み取りに失敗",
      error,
    );
  }
}

/**
 * レッスンの完了をまとめて記録する（アプリ向け）
 * レッスン完了API（アプリ向け）
 *
 * web の `completeLessons` と同じく冪等。カリキュラムに無い slug は記録せず
 * `rejected` で返す（アプリは未送信から外す）。誰の完了かはトークンだけで決め、
 * 本文に userId を受け取らない。退会を受け付けた後には書かない（403 `deleted`）。
 */
export async function handleCompleteLessons(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "completeLessons");
  if (!auth.ok) return auth.response;
  const body = await parseMobileBody(request, completeLessonsSchema, 8 * 1024);
  if (!body.ok) return body.response;
  const { completed, rejected } = partitionLessonSlugs(body.data.slugs);
  try {
    if (!(await recordLessonCompletions(auth.user.id, completed)))
      return mobileJson({ error: "deleted" }, { status: 403 });
  } catch (error) {
    return mobileServerError(
      "POST /api/mobile/v1/lessons/complete",
      "記録に失敗",
      error,
    );
  }
  return mobileJson<MobileCompleteLessonsResponse>({ completed, rejected });
}
