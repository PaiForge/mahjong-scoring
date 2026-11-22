import { z } from "zod";

import {
  ARCHIVE_SCHEMA_VERSION,
  parsePracticeProblemArchiveRequest,
} from "@mahjong-scoring/core";
import type { AgariProblemPayload } from "@mahjong-scoring/core";

import type { DailyAnswerDetail } from "./answer-detail";

/**
 * アプリ向けの本日の問題の API の契約
 * 本日の問題API契約
 *
 * 認証とエラーの理由（`unauthorized` 等）は `account/mobile-api.ts` と共通。
 * ここには本日の問題に固有のものだけを置く。応答の項目を足すときは省略可能に
 * する — ストアに出ている版のアプリが古い形のまま読む。
 *
 * @design 入口は 2 つ。どちらも Bearer 認証で、他の利用者の情報は返さない
 *
 * - `GET /api/mobile/v1/daily-problem` — 今日（JST）の問題の盤面と、自分の解答
 * - `POST /api/mobile/v1/daily-problem/answer` — 自分の解答の正誤を記録する
 *
 * アプリには他の利用者を見せる画面を持ち込まないので、全体の正解率・解答者数の
 * ように他の利用者の解答から作る値も返さない（web だけに出す）。項目を足すとき
 * もこの線を守る。
 *
 * @design 盤面だけを返し、正解は返さない
 *
 * 正解は閲覧者のルール設定で決まるので、アプリが盤面を
 * `daily-problem/question.ts` の規則で組み立て直し、その場で採点して答え合わせを
 * 出す。サーバーへは端末の正誤と、解答の中身（`detail`）を送る。統計が使う判定は
 * サーバーが受付時に付けるが、その結果は応答に載せない（答え合わせは端末のもの）。
 */

const MOBILE_API_PREFIX = "/api/mobile/v1";

/**
 * 今日の問題と自分の解答を返す API のパス（GET。要ログイン）
 * 本日の問題APIパス
 */
export const MOBILE_DAILY_PROBLEM_API_PATH = `${MOBILE_API_PREFIX}/daily-problem`;

/**
 * 今日の問題の解答（正誤）を記録する API のパス（POST。要ログイン）
 * 本日の問題解答APIパス
 */
export const MOBILE_DAILY_PROBLEM_ANSWER_API_PATH = `${MOBILE_DAILY_PROBLEM_API_PATH}/answer`;

/**
 * 自分の解答の状態
 * 本日の問題解答状態
 */
export interface DailyProblemAnswerState {
  /** 正解したか（クライアントが閲覧者のルール設定で採点した結果） */
  readonly isCorrect: boolean;
}

/**
 * 今日の問題の応答
 * 本日の問題応答
 */
export interface MobileDailyProblemResponse {
  /** 対象の日（JST の日付キー `YYYY-MM-DD`）。解答の記録の要求にそのまま載せる */
  readonly day: string;
  /** 今日の問題の盤面。今日は問題が無ければ null */
  readonly problem: { readonly payload: AgariProblemPayload } | null;
  /** 自分の解答。まだ解いていなければ null */
  readonly answer: DailyProblemAnswerState | null;
}

/**
 * 解答の記録の要求
 * 本日の問題解答要求
 *
 * `day` は {@link MobileDailyProblemResponse} の `day`。日をまたいでから送ると
 * サーバーは `staleDay` で弾く（昨日の問題の解答を今日の記録にしない）。
 *
 * `detail` は解答の中身と解答時の条件（`answer-detail.ts`）。省略できる — 詳細を
 * 送らない版のアプリは `{ day, isCorrect }` のまま送り、サーバーは旧記録として残す。
 * 端末は最初の解答のときに作った `detail` を預かり、再送でも作り直さない。
 */
export interface MobileDailyProblemAnswerRequest {
  readonly day: string;
  readonly isCorrect: boolean;
  readonly detail?: DailyAnswerDetail;
}

/**
 * 解答の記録の応答
 * 本日の問題解答応答
 *
 * 記録した後の自分の解答を返す。アプリは画面の解答の状態をこれで置き換える。
 */
export interface MobileDailyProblemAnswerResponse {
  readonly answer: DailyProblemAnswerState;
}

/**
 * 本日の問題の API 固有の失敗の理由
 *
 * - `staleDay` — 要求の `day` が今日（JST）でない、または今日の問題が無い（409）。
 *   アプリは今日の問題を取り直す
 * - `unsupportedDetail` — `detail` の版をサーバーが知らない（422）。デプロイの切り替え中に
 *   新しい端末が古いサーバーへ送ったときに起きる。保存していないので、端末は預かりを
 *   残して同じ内容を送り直す
 * - `invalidDetail` — `detail` の版は知っているが形が違う（422）。保存していない。
 *   端末の実装の不具合でしか起きず、送り直しても結果は変わらない
 *
 * `detail` の 2 つは旧記録に落として保存しない — 成功を返すと端末が預かりを捨て、
 * 直した後も最初の 1 件を入れ直せず、詳細を送らない版の行と見分けもつかなくなる。
 */
export const MOBILE_DAILY_PROBLEM_ERROR_CODES = [
  "staleDay",
  "unsupportedDetail",
  "invalidDetail",
] as const;

/** 本日の問題の API 固有の失敗の理由（{@link MOBILE_DAILY_PROBLEM_ERROR_CODES}） */
export type MobileDailyProblemErrorCode =
  (typeof MOBILE_DAILY_PROBLEM_ERROR_CODES)[number];

const dailyProblemErrorCodeSet: ReadonlySet<string> = new Set(
  MOBILE_DAILY_PROBLEM_ERROR_CODES,
);

/** 値が本日の問題の API 固有の失敗の理由かを判定する型ガード */
export function isMobileDailyProblemErrorCode(
  value: unknown,
): value is MobileDailyProblemErrorCode {
  return typeof value === "string" && dailyProblemErrorCodeSet.has(value);
}

/**
 * 日付キーの形（JST の `YYYY-MM-DD`）のスキーマ
 * 日付キースキーマ
 *
 * 暦として正しいかは見ない — 値はサーバーが決める。アプリ向け API の本文と
 * web の Server Action の入力が、同じ形だけを受けるよう共有する。
 */
export const dailyProblemDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const answerStateSchema = z.object({ isCorrect: z.boolean() });

const dailyProblemSchema = z.object({
  day: dailyProblemDaySchema,
  problem: z.object({ payload: z.unknown() }).nullable(),
  answer: answerStateSchema.nullable(),
});

const answerResponseSchema = z.object({ answer: answerStateSchema });

/**
 * 盤面を保存形式の検証に通す。和了形として受け付けられなければ undefined
 *
 * 盤面の形はここで書き直さず、保存のときと同じ検証（core の
 * `parsePracticeProblemArchiveRequest`）を通す。形の定義を 2 つ持たないため。
 */
function agariPayloadOf(payload: unknown): AgariProblemPayload | undefined {
  const parsed = parsePracticeProblemArchiveRequest({
    kind: "agari-score",
    schemaVersion: ARCHIVE_SCHEMA_VERSION,
    payload,
  });
  if (parsed.isErr()) return undefined;
  const request = parsed.value;
  return request.kind === "agari-score" ? request.payload : undefined;
}

/**
 * 今日の問題の応答を検証する。形が違えば undefined
 * 本日の問題応答検証
 *
 * 盤面が和了形の保存形式として受け付けられないときも undefined（盤面を
 * 組み立てられない応答を「問題なし」と取り違えない）。
 */
export function parseMobileDailyProblemResponse(
  body: unknown,
): MobileDailyProblemResponse | undefined {
  const parsed = dailyProblemSchema.safeParse(body);
  if (!parsed.success) return undefined;
  const { day, problem, answer } = parsed.data;
  if (problem === null) return { day, problem: null, answer };
  const payload = agariPayloadOf(problem.payload);
  if (payload === undefined) return undefined;
  return { day, problem: { payload }, answer };
}

/**
 * 解答の記録の応答を検証する。形が違えば undefined
 * 本日の問題解答応答検証
 */
export function parseMobileDailyProblemAnswerResponse(
  body: unknown,
): MobileDailyProblemAnswerResponse | undefined {
  const parsed = answerResponseSchema.safeParse(body);
  return parsed.success ? { answer: parsed.data.answer } : undefined;
}
