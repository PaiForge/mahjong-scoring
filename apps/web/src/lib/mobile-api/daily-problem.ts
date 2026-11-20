/**
 * 本日の問題（アプリ向け API）
 * 本日の問題API（アプリ向け）
 *
 * @description
 * `GET /api/mobile/v1/daily-problem`（今日の問題と自分の解答）と
 * `POST /api/mobile/v1/daily-problem/answer`（解答の記録）の本体。応答の形は
 * features の契約（`daily-problem/mobile-api.ts`）で決める。
 *
 * @design 返すのは今日の問題と本人の解答だけ
 * どちらも Bearer 認証で、誰の解答かはトークンだけで決める（本文に userId を
 * 受け取らない）。全体の正解率・解答者数のような他の利用者の情報は返さない —
 * アプリには他の利用者を見せる画面を持ち込まない規約があり、本日の問題も
 * その外に置く。
 *
 * @design ユーザー名を決める前でも読み書きできる
 * レッスンの完了（`handleCompleteLessons`）と同じく、本人にしか見せない記録なので
 * ユーザー名を条件にしない（記録は `auth.users` に紐づき、プロフィールを要らない）。
 */
import "server-only";

import type { NextResponse } from "next/server";
import { z } from "zod";

import {
  dailyProblemDaySchema,
  type MobileDailyProblemAnswerRequest,
  type MobileDailyProblemAnswerResponse,
  type MobileDailyProblemResponse,
} from "@mahjong-scoring/features/daily-problem/mobile-api";
import { jstDayKey } from "@mahjong-scoring/features/jst";

import {
  readDailyProblemAnswer,
  recordDailyProblemAnswer,
} from "../daily-problem/answers";
import {
  getDailyProblem,
  isDailyProblemDisabled,
} from "../daily-problem/today";

import { authorizeMobileRequest } from "./auth";
import { parseMobileBody } from "./request";
import { mobileDeleted, mobileJson, mobileServerError } from "./response";

const BODY_MAX_BYTES = 1024;

// 日付は JST の日付キー（`YYYY-MM-DD`）の形だけを受ける。形が違えば 400、
// 形が合っていて今日でなければ 409 `staleDay`（記録の側で判定する）
const answerSchema: z.ZodType<MobileDailyProblemAnswerRequest> = z.object({
  day: dailyProblemDaySchema,
  isCorrect: z.boolean(),
});

/** 日付が今日でない・今日の問題が無いときの 409 `staleDay` */
function mobileStaleDay(): NextResponse {
  return mobileJson<{ error: "staleDay" }>(
    { error: "staleDay" },
    { status: 409 },
  );
}

/**
 * 今日（JST）の問題と自分の解答を読む（アプリ向け）
 * 本日の問題取得API（アプリ向け）
 *
 * 問題が無い日（停止中・候補なし）も 200 で `problem: null` を返す — アプリは
 * その日の枠を出さないだけで、エラーとして扱わない。`answer` はトークンの本人の
 * その日の最初の解答で、未解答なら null。DB の失敗は 500（アプリは送り直してよい）。
 */
export async function handleReadDailyProblem(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readMobileDailyProblem");
  if (!auth.ok) return auth.response;
  const now = new Date();
  const day = jstDayKey(now);
  try {
    const [problem, answer] = await Promise.all([
      getDailyProblem(now),
      readDailyProblemAnswer(auth.user.id, day),
    ]);
    return mobileJson<MobileDailyProblemResponse>({
      day,
      problem: problem ? { payload: problem.payload } : null,
      answer: answer ?? null,
    });
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/daily-problem",
      "本日の問題の読み取りに失敗",
      error,
    );
  }
}

/**
 * 本日の問題の解答（正誤）を記録する（アプリ向け）
 * 本日の問題解答API（アプリ向け）
 *
 * @design 採点はアプリで行い、正誤だけを受け取る
 * アプリが閲覧者のルール設定・標準の判定モードで採点し、`isCorrect` だけを送る。
 * サーバーが確かめるのは「`day` が今日（JST）で、その日の問題がある」ことだけ。
 * 記録は本人にしか見せず、ランキングも特典も無いので正誤を偽る動機が無い。
 * サーバーで採点すると、解答の形の契約と採点をアプリとサーバーで二重に持つことになる。
 *
 * @design 解き直しは受け付けるが記録は変わらない
 * 解答済みの日に送られても 200 で、保存されている最初の解答を `answer` に返す
 * （見直しを禁じる理由は無いが、答えを見てから正解に書き換えさせない）。
 *
 * @design 409 `staleDay` = 今日の問題への解答ではない
 * `day` が今日（JST）でない（日付をまたいで送られた）、その日の問題が無い、
 * または本日の問題を止めている（GET が `problem: null` を返す状態）ときは記録せず
 * 409 `staleDay`。前日の問題を今日の解答として残さない。アプリは未送信の解答を
 * 捨て、今日の問題を読み直す。送り直しても結果は変わらない。
 *
 * 本文の形が違えば 400 `invalidRequest`。DB の失敗は 500。
 */
export async function handleRecordDailyProblemAnswer(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(
    request,
    "recordMobileDailyProblemAnswer",
  );
  if (!auth.ok) return auth.response;
  const body = await parseMobileBody(request, answerSchema, BODY_MAX_BYTES);
  if (!body.ok) return body.response;
  // 止めている間は GET が問題を出さないので、解答も今日の問題への解答として扱わない
  if (isDailyProblemDisabled()) return mobileStaleDay();
  const { day, isCorrect } = body.data;
  try {
    const result = await recordDailyProblemAnswer(
      auth.user.id,
      day,
      isCorrect,
      new Date(),
    );
    if (result.kind === "deleted") return mobileDeleted();
    if (result.kind === "staleDay") return mobileStaleDay();
    return mobileJson<MobileDailyProblemAnswerResponse>({
      answer: result.answer,
    });
  } catch (error) {
    return mobileServerError(
      "POST /api/mobile/v1/daily-problem/answer",
      "本日の問題の解答の記録に失敗",
      error,
    );
  }
}
