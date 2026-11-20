/**
 * 本日の問題の解答の記録
 * 本日の問題解答記録
 *
 * @description
 * ログイン済みの利用者の、本日の問題への解答（正誤）を表 `daily_problem_answers` に
 * 1 日 1 件残し、読む。web の Server Action とアプリ向け API の入口が、認証を
 * 済ませてからここを呼ぶ。記録は本人にしか見せない。
 *
 * @design 最初の解答だけを残す（`ON CONFLICT DO NOTHING`）
 * 再挑戦で上書きすると、答えを見てから正解に書き換えられる。「わからない」は
 * 不正解として記録する（呼び出し側が `isCorrect: false` で送る）。持つのは正誤だけ —
 * 「解答済み」をホームに出すのに要る最小の形で、正誤まで持てば連続日数・
 * 正解率を後から同じ表で足せる。
 */
import "server-only";

import type { DailyProblemAnswerState } from "@mahjong-scoring/features/daily-problem/mobile-api";
import { jstDayKey } from "@mahjong-scoring/features/jst";
import { and, eq } from "drizzle-orm";

import {
  dailyProblemAnswers,
  dailyProblems,
  db,
  type TransactionClient,
} from "../db";
import { writeAsAccount } from "../users/account-write-lock";
import { isDailyProblemDisabled } from "./today";

/**
 * {@link recordDailyProblemAnswer} の結果
 *
 * - `deleted`: 退会受付済み。書き込まない
 * - `recorded`: 記録した、または記録済みだった。`answer` は保存されている最初の解答
 * - `staleDay`: 今日（JST）の問題への解答ではない（日付違い・その日の問題が無い）。記録しない
 */
export type RecordDailyProblemAnswerResult =
  | { kind: "recorded"; answer: DailyProblemAnswerState }
  | { kind: "staleDay" }
  | { kind: "deleted" };

/**
 * 利用者のその日の解答を読む
 * 本日の問題解答取得
 *
 * @param userId - 認証済みの利用者の ID
 * @param day - JST の日付（`YYYY-MM-DD`）
 * @param client - 保存後の読込では同じトランザクションを渡す
 * @returns 記録されている最初の解答。まだ解答していなければ undefined
 * @throws DB の読み取りに失敗したとき
 */
export async function readDailyProblemAnswer(
  userId: string,
  day: string,
  client: Pick<TransactionClient, "select"> = db,
): Promise<DailyProblemAnswerState | undefined> {
  const [row] = await client
    .select({ isCorrect: dailyProblemAnswers.isCorrect })
    .from(dailyProblemAnswers)
    .where(
      and(
        eq(dailyProblemAnswers.userId, userId),
        eq(dailyProblemAnswers.day, day),
      ),
    )
    .limit(1);
  return row ? { isCorrect: row.isCorrect } : undefined;
}

/**
 * 本日の問題の解答を記録する（その日の最初の 1 件だけ）
 * 本日の問題解答記録
 *
 * @design 採点はクライアントで行い、サーバーは正誤だけを受け取る
 * サーバーが確かめるのは「日付が今日（JST）で、その日の問題がある」ことだけ。
 * 記録は本人にしか見せず、ランキングも特典も無いので、正誤を偽る動機が無い。
 * サーバーで採点すると、解答の形の契約と採点をクライアントとサーバーで二重に
 * 持つことになる。
 *
 * @design 解答済みでも解き直せるが、記録は変わらない。日付をまたいだ解答は捨てる
 * 同じ盤面をもう一度解いて送っても `ON CONFLICT DO NOTHING` で何も書き換えず、
 * 保存されている最初の解答を返す（見直しを禁じる理由は無い）。日付をまたいで
 * 届いた解答（`day` が今日でない）は記録せず `staleDay` を返す — 前日の問題を
 * 今日の解答として残さない。
 *
 * @design 共有ロックを再読込まで保持し、退会受付と直列化する
 * 受付が先なら書かず、保存が先なら退会の削除工程で消える。
 *
 * @param userId - 認証済みの利用者の ID
 * @param day - 解いた問題の日付（JST の `YYYY-MM-DD`。クライアントが問題と一緒に受け取った値）
 * @param isCorrect - クライアントが閲覧者のルール設定で採点した正誤（「わからない」は false）
 * @param now - 今の時刻（今日の日付の判定に使う）
 * @throws DB の読み書きに失敗したとき
 */
export async function recordDailyProblemAnswer(
  userId: string,
  day: string,
  isCorrect: boolean,
  now: Date,
): Promise<RecordDailyProblemAnswerResult> {
  if (isDailyProblemDisabled() || day !== jstDayKey(now))
    return { kind: "staleDay" };
  const outcome = await writeAsAccount(
    userId,
    async (tx): Promise<RecordDailyProblemAnswerResult> => {
      const [problem] = await tx
        .select({
          day: dailyProblems.day,
          withheldReason: dailyProblems.withheldReason,
        })
        .from(dailyProblems)
        .where(eq(dailyProblems.day, day))
        .limit(1)
        .for("share");
      if (!problem || problem.withheldReason) return { kind: "staleDay" };
      await tx
        .insert(dailyProblemAnswers)
        .values({ userId, day, isCorrect })
        .onConflictDoNothing();
      const answer = await readDailyProblemAnswer(userId, day, tx);
      // 直前に入れたか、先に入っていた行がある。消す経路は退会だけ
      if (!answer)
        throw new Error("Daily problem answer vanished after insert");
      return { kind: "recorded", answer };
    },
  );
  return outcome.written ? outcome.value : { kind: "deleted" };
}
