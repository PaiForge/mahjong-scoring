"use server";

import { z } from "zod";

import { dailyProblemDaySchema } from "@mahjong-scoring/features/daily-problem/mobile-api";

import { revalidateLocalizedPaths } from "@/i18n/revalidate-localized-paths";
import type { ActionResult } from "@/lib/action-types";
import { recordDailyProblemAnswer } from "@/lib/daily-problem/answers";
import { logExternalError } from "@/lib/log-error";
import {
  resolveRecorder,
  type RecorderErrorCode,
} from "@/lib/resolve-recorder";

/**
 * 本日の問題の解答の記録が返しうるエラーコード
 * 本日の問題解答記録エラーコード
 *
 * - `banned` / `authUnavailable`: 記録を書ける本人を決められなかった（{@link RecorderErrorCode}）
 * - `invalidInput`: 入力の形が違う（UI のバグ。盤面からは起きない）
 * - `staleDay`: 日付が変わった・停止中・問題がない。画面に再読込を案内する
 * - `recordFailed`: DB への書き込みに失敗した（ログに残す）
 *
 * どのエラーでも盤面の答え合わせは止めない。記録は「解いた」印にすぎず、
 * 答え合わせの表示は採点（クライアント）だけで完結するため。画面は保存状態を別に表示する。
 */
export type RecordDailyProblemAnswerErrorCode =
  RecorderErrorCode | "invalidInput" | "recordFailed" | "staleDay";

/**
 * 本日の問題の解答を記録する Server Action の戻り値
 * 本日の問題解答記録結果
 *
 * - `{ success: true }`: 記録した。既に記録済みでも最初の解答を保つ
 * - `{ success: true, skipped: 'anonymous' }`: 未ログイン。記録しない（期待された no-op）
 * - `{ error }`: {@link RecordDailyProblemAnswerErrorCode}
 */
export type RecordDailyProblemAnswerResult = ActionResult<
  RecordDailyProblemAnswerErrorCode,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- 記録した成功は追加フィールドを持たない
  {} | { readonly skipped: "anonymous" }
>;

/** 入力（クライアント由来なので形を確かめる） */
const inputSchema = z.object({
  /** 表示した利用者と現在のセッションが一致するかを確かめる（認証には使わない） */
  userId: z.string().optional(),
  /** 解いた問題の日付（JST の `YYYY-MM-DD`。ページがサーバーから渡した値） */
  day: dailyProblemDaySchema,
  /** 閲覧者のルール設定で採点した正誤（「わからない」は false） */
  isCorrect: z.boolean(),
});

/**
 * 解答済みを読む画面（ロケール非依存のパス）。ホームのカードが「解答済み」を出す
 */
const ANSWER_READER_PATHS = ["/dashboard"] as const;

/**
 * 解答済みを読む画面のキャッシュを、両言語の分とも捨てる
 *
 * 接頭辞なしのパスと言語ごとの内部パス（`/ja/dashboard`・`/en/dashboard`）の
 * 両方で捨てる（理由は {@link revalidateLocalizedPaths}）。
 */
function revalidateAnswerReaders(): void {
  revalidateLocalizedPaths(ANSWER_READER_PATHS);
}

/**
 * 本日の問題の解答（正誤）を記録する Server Action
 * 本日の問題解答記録
 *
 * 本日の問題の盤面が、最初の回答または「わからない」で呼ぶ。通信失敗時は同じ正誤を再送する。
 * 採点はクライアントで済んでおり、ここは正誤を受け取って残すだけ（記録は本人に
 * しか見せず、ランキングも特典も無いので正誤を偽る動機が無い）。
 *
 * 誰の解答として残すかは cookie のセッションだけで決める（{@link resolveRecorder}。
 * 書き込む Action なので BAN も確かめ、退会の受付後は未ログインと同じく書かない）。
 * プロフィール（ユーザー名）の有無は問わない — レッスンの完了と同じく、
 * 登録の途中の利用者の解答も残す。レート制限は掛けない（レッスンの完了と同じ。
 * 1 日 1 件の主キーで、何度呼ばれても行は増えない）。
 *
 * - 未ログインは記録せず `{ success: true, skipped: 'anonymous' }`
 * - 日付が今日（JST）でない解答は記録せず捨てる（`staleDay`。前日の問題を今日の
 *   解答として残さない）。画面は今日の問題への再読込を案内する
 * - 既に解答済みなら何も書き換えない（最初の解答が残る）
 * - DB の失敗はログに残して `recordFailed` を返す。盤面は答え合わせを続ける
 *
 * @param input - `{ day, isCorrect, userId? }`。`day` はページがサーバーから渡した問題の日付
 */
export async function recordDailyProblemAnswerAction(
  input: unknown,
): Promise<RecordDailyProblemAnswerResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { error: "invalidInput" };
  const { day, isCorrect } = parsed.data;

  const recorder = await resolveRecorder();
  if ("skipped" in recorder) return { success: true, skipped: "anonymous" };
  if ("error" in recorder) return { error: recorder.error };

  if (
    parsed.data.userId !== undefined &&
    parsed.data.userId !== recorder.user.id
  )
    return { success: true, skipped: "anonymous" };

  try {
    const result = await recordDailyProblemAnswer(
      recorder.user.id,
      day,
      isCorrect,
      new Date(),
    );
    if (result.kind === "deleted")
      return { success: true, skipped: "anonymous" };
    if (result.kind === "staleDay") return { error: "staleDay" };
    if (result.kind === "recorded") revalidateAnswerReaders();
  } catch (error: unknown) {
    logExternalError(
      "recordDailyProblemAnswer",
      "本日の問題の解答を記録できなかった",
      error,
    );
    return { error: "recordFailed" };
  }
  return { success: true };
}
