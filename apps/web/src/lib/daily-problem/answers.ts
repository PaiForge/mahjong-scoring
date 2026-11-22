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
 * 不正解として記録する（呼び出し側が `isCorrect: false` で送る）。受付後の行は
 * 書き換えない — 採点を改修しても、受付時の判定を後から入れ直さない。
 */
import "server-only";

import {
  SCORING_VERSION,
  parsePracticeProblemArchiveRequest,
  type AgariProblemPayload,
} from "@mahjong-scoring/core";
import type { DailyAnswerDetail } from "@mahjong-scoring/features/daily-problem/answer-detail";
import {
  judgeDailyAnswerAtReceipt,
  type DailyAnswerReceipt,
} from "@mahjong-scoring/features/daily-problem/answer-receipt";
import { dailyAnswerSnapshotSchema } from "@mahjong-scoring/features/daily-problem/answer-snapshot";
import type { DailyProblemAnswerState } from "@mahjong-scoring/features/daily-problem/mobile-api";
import { jstDayKey } from "@mahjong-scoring/features/jst";
import { and, eq } from "drizzle-orm";

import {
  dailyProblemAnswers,
  dailyProblems,
  db,
  practiceProblems,
  type TransactionClient,
} from "../db";
import { logExternalError } from "../log-error";
import type { PracticeProblemSource } from "../practice-problems/source";
import { lockAccountForWrite } from "../users/account-write-lock";
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
 * 詳細付きの解答（入口が検証を済ませたもの）
 * 詳細付き解答
 */
export interface DailyAnswerSubmission {
  /** 解答時に端末が固定した詳細（`parseDailyAnswerDetail` を通した値） */
  readonly detail: DailyAnswerDetail;
  /** 届いた入口。サーバーが決める（本文の申告は使わない） */
  readonly source: PracticeProblemSource;
}

/** 保存行を和了形の盤面にする。現行の保存形式の検証を通らなければ undefined */
function agariPayloadOf(row: {
  readonly kind: string;
  readonly schemaVersion: number;
  readonly payload: unknown;
}): AgariProblemPayload | undefined {
  // 保存形式の検証は余分な項目を受けないので、要る 3 項目だけを渡す
  const parsed = parsePracticeProblemArchiveRequest({
    kind: row.kind,
    schemaVersion: row.schemaVersion,
    payload: row.payload,
  });
  return parsed.isOk() && parsed.value.kind === "agari-score"
    ? parsed.value.payload
    : undefined;
}

/**
 * 詳細付きの解答を、受付時の採点で判定して保存する列にする
 *
 * 保存済みのスナップショットが現行の保存形式で読めないときは「選出時の情報なし」
 * として扱い、ログに残す（解答は捨てない）。
 */
function detailColumnsOf(
  { detail, source }: DailyAnswerSubmission,
  problem: {
    readonly kind: string;
    readonly schemaVersion: number;
    readonly payload: unknown;
    readonly answerSnapshot: unknown;
  },
  day: string,
) {
  const snapshot =
    problem.answerSnapshot === null
      ? undefined
      : dailyAnswerSnapshotSchema.safeParse(problem.answerSnapshot);
  if (snapshot && !snapshot.success)
    logExternalError(
      "recordDailyProblemAnswer",
      "選出時のスナップショットを読めない",
      day,
    );
  const payload = agariPayloadOf(problem);
  const receipt: DailyAnswerReceipt =
    payload === undefined
      ? { kind: "unjudgeable", judgeError: "invalidPayload" }
      : judgeDailyAnswerAtReceipt(
          payload,
          detail,
          snapshot?.success ? snapshot.data : null,
        );
  const judged = receipt.kind === "judged" ? receipt : undefined;
  return {
    detailVersion: detail.v,
    outcome: detail.outcome,
    requireYaku: detail.mode.requireYaku,
    requireHanFu: detail.mode.requireHanFu,
    exactHan: detail.mode.exactHan,
    requireFuForMangan: detail.mode.requireFuForMangan,
    submitted: detail.outcome === "answered" ? detail.answer : null,
    scoreResult: judged?.fields?.score ?? null,
    hanResult: judged?.fields?.han ?? null,
    fuResult: judged?.fields?.fu ?? null,
    yakuResult: judged?.fields?.yaku ?? null,
    judgedCorrect: judged?.judgedCorrect ?? null,
    judgeError: receipt.kind === "unjudgeable" ? receipt.judgeError : null,
    snapshotConsistent: judged?.snapshotConsistent ?? null,
    scoringVersion: SCORING_VERSION,
    source,
    client: detail.client,
    revision: process.env.VERCEL_GIT_COMMIT_SHA || null,
  };
}

/**
 * 本日の問題の解答を記録する（その日の最初の 1 件だけ）
 * 本日の問題解答記録
 *
 * @design 端末の正誤（`is_correct`）と受付時の判定は別に持つ
 * 端末は今までどおり閲覧者のルール設定で採点して答え合わせを出し、その正誤を送る。
 * ホームの「解答済み」はこれを読む。詳細（`submission`）が付いていれば、サーバーは
 * 受付時の採点で盤面を組み立て直し、適格判定を通ったときだけ欄ごとの判定を残す
 * （規則は features の `daily-problem/answer-receipt.ts`）。統計は受付時の判定だけを使う。
 * 解答の形の契約は features の zod スキーマ 1 つ、採点は core の関数 1 つなので、
 * 端末とサーバーで二重に持つものは無い。
 *
 * @design 採点不能でも「解いた」印は残す
 * 選出後の採点の改修で盤面が不適格になった・組み立てられない日は、判定せず
 * `judge_error` を残して保存する（解答も「わからない」も）。端末の正誤は残るので
 * 印は今までどおり付き、統計には入れない。DB の障害は採点不能にせず例外のまま返す。
 *
 * @design 詳細の無い要求は旧記録として残す
 * 詳細を送らない古い版のアプリは `{ day, isCorrect }` のまま届く。詳細の列は
 * すべて NULL で、既定値で埋めない。
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
 * @param submission - 詳細付きの解答。省くと旧記録として残す
 * @throws DB の読み書きに失敗したとき
 */
export async function recordDailyProblemAnswer(
  userId: string,
  day: string,
  isCorrect: boolean,
  now: Date,
  submission?: DailyAnswerSubmission,
): Promise<RecordDailyProblemAnswerResult> {
  if (isDailyProblemDisabled() || day !== jstDayKey(now))
    return { kind: "staleDay" };
  return db.transaction(async (tx): Promise<RecordDailyProblemAnswerResult> => {
    if (!(await lockAccountForWrite(tx, userId))) return { kind: "deleted" };
    const [problem] = await tx
      .select({
        day: dailyProblems.day,
        withheldReason: dailyProblems.withheldReason,
        answerSnapshot: dailyProblems.answerSnapshot,
        kind: practiceProblems.kind,
        schemaVersion: practiceProblems.schemaVersion,
        payload: practiceProblems.payload,
      })
      .from(dailyProblems)
      .innerJoin(
        practiceProblems,
        eq(dailyProblems.problemId, practiceProblems.id),
      )
      .where(eq(dailyProblems.day, day))
      .limit(1)
      .for("share", { of: dailyProblems });
    if (!problem || problem.withheldReason) return { kind: "staleDay" };
    await tx
      .insert(dailyProblemAnswers)
      .values({
        userId,
        day,
        isCorrect,
        ...(submission ? detailColumnsOf(submission, problem, day) : {}),
      })
      .onConflictDoNothing();
    const answer = await readDailyProblemAnswer(userId, day, tx);
    // 直前に入れたか、先に入っていた行がある。消す経路は退会だけ
    if (!answer) throw new Error("Daily problem answer vanished after insert");
    return { kind: "recorded", answer };
  });
}
