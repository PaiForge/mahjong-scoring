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

import { parseDailyAnswerDetail } from "@mahjong-scoring/features/daily-problem/answer-detail";
import {
  dailyProblemDaySchema,
  type MobileDailyProblemAnswerResponse,
  type MobileDailyProblemErrorCode,
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

import { logExternalError } from "../log-error";

import { authorizeMobileRequest } from "./auth";
import { mobilePlatformOf } from "./platform";
import { parseMobileBody } from "./request";
import { mobileDeleted, mobileJson, mobileServerError } from "./response";

// 詳細（解答の中身・回答モード・解答時のルール設定）を含む本文の上限。役を上限まで
// 選んだ解答でも 2KB に届かない
const BODY_MAX_BYTES = 4096;

// 日付は JST の日付キー（`YYYY-MM-DD`）の形だけを受ける。形が違えば 400、
// 形が合っていて今日でなければ 409 `staleDay`（記録の側で判定する）。
// `detail` はここでは形を見ない — 版の違いと形の違いを分けて答えるため、
// `parseDailyAnswerDetail` に通す
const answerSchema = z.object({
  day: dailyProblemDaySchema,
  isCorrect: z.boolean(),
  detail: z.unknown().optional(),
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
 * 本日の問題の解答を記録する（アプリ向け）
 * 本日の問題解答API（アプリ向け）
 *
 * @design アプリの正誤と、受付時の判定は別に残す
 * アプリは閲覧者のルール設定で採点して答え合わせを出し、その正誤（`isCorrect`）と
 * 解答の中身（`detail`）を送る。サーバーは `detail` があれば受付時の採点で判定して
 * 残す（規則は `lib/daily-problem/answers.ts`）。記録は本人にしか見せず、ランキングも
 * 特典も無いので正誤を偽る動機が無い。
 *
 * @design `detail` の無い要求は旧記録、読めない `detail` は保存しない
 * 詳細を送らない版のアプリは `{ day, isCorrect }` のまま届き、今までどおり残す。
 * `detail` の版を知らなければ 422 `unsupportedDetail`（アプリは同じ内容を送り直す）、
 * 形が違えば 422 `invalidDetail`（送り直さない）。どちらも旧記録に落とさない。
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
  const detail = parseDailyAnswerDetail(body.data.detail);
  if (detail.kind === "unsupportedDetail" || detail.kind === "invalidDetail") {
    if (detail.kind === "invalidDetail")
      logExternalError(
        "POST /api/mobile/v1/daily-problem/answer",
        "本日の問題の解答の詳細の形が不正",
        day,
      );
    return mobileJson<{ error: MobileDailyProblemErrorCode }>(
      { error: detail.kind },
      { status: 422 },
    );
  }
  try {
    const result = await recordDailyProblemAnswer(
      auth.user.id,
      day,
      isCorrect,
      new Date(),
      detail.kind === "valid"
        ? // 由来は要求のヘッダから決める（本文の申告は使わない）
          { detail: detail.detail, source: mobilePlatformOf(request) }
        : undefined,
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
