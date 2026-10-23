import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import {
  isPracticeMenuType,
  isPracticeVariant,
  type PracticeMenuType,
} from "@mahjong-scoring/features/practice-menu-types";
import type {
  ChallengeOutcome,
  ChallengeSettings,
  ChallengeState,
} from "@mahjong-scoring/features/challenge/types";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";
import { publicChallengeQuestion } from "./questions";
import { challengeElapsed, challengeRemainingMs } from "./transitions";

/**
 * 挑戦の要求の検証と、行から応答を組む投影
 * 挑戦の応答の組み立て
 *
 * `attempts.ts` が DB の読み書きとロックの間で呼ぶ、DB に触れない部分。
 * 要求の形の検証（{@link parseBeginRequest}）と、読んだ行を API の応答の形に
 * 写す関数（{@link attemptEntry}・{@link attemptStatus}・{@link finishResult}）を
 * 持つ。再送の規則（{@link resumableEntry}）もここ — 同じ ID の再送に既存の
 * 挑戦を返してよいかは行と要求だけで決まる。
 *
 * 遷移の規則は `transitions.ts`、回答の受付の規則は `answer-decision.ts`。
 */

const uuid = z.string().uuid();
const settingsSchema = z.object({ renfonpaiAs4Fu: z.boolean() });

/** 挑戦 ID として読める値か（UUID の文字列） */
export function isAttemptId(id: unknown): id is string {
  return typeof id === "string" && uuid.safeParse(id).success;
}

/** 検証を通った開始の要求 */
export interface BeginRequest {
  readonly menuType: PracticeMenuType;
  readonly variant: string;
  readonly settings: ChallengeSettings;
  /** 呼び出し側が決めた挑戦 ID。無ければ DB が決める */
  readonly id: string | undefined;
}

/** 開始の要求の形を検証する。練習・バリアント・設定・ID のどれかが不正なら undefined */
export function parseBeginRequest(
  menuType: unknown,
  variant: unknown,
  settings: unknown,
  requestedId: unknown,
): BeginRequest | undefined {
  if (
    !isPracticeMenuType(menuType) ||
    typeof variant !== "string" ||
    !isPracticeVariant(menuType, variant)
  )
    return undefined;
  const parsed = settingsSchema.safeParse(settings);
  if (!parsed.success) return undefined;
  const base = { menuType, variant, settings: parsed.data };
  if (requestedId === undefined) return { ...base, id: undefined };
  return isAttemptId(requestedId) ? { ...base, id: requestedId } : undefined;
}

/** 応答を組むのに要る挑戦行の列 */
export interface AttemptRow {
  readonly id: string;
  readonly state: ChallengeState;
  readonly consumed: boolean;
}

/** 開始・復帰の応答で見せる挑戦の入口。出題は正解を伏せる。 */
export function attemptEntry(id: string, state: ChallengeState) {
  return {
    id,
    sequence: state.sequence,
    question: publicChallengeQuestion(state.question, state.menuType),
  };
}

/**
 * 開始の再送で既存の挑戦を返せるなら、その入口を返す。
 *
 * 同じ ID で別の練習・バリアント・ルール設定を送った要求は再送ではなく
 * 競合なので返さない。設定まで比べるのは、違う設定で始めたつもりの
 * 端末に、サーバーが固定した別の設定の挑戦を渡すと、端末の表示と
 * サーバーの採点の条件が食い違うため。確定済みの挑戦にも返さない。
 */
export function resumableEntry(
  row: AttemptRow,
  request: Pick<BeginRequest, "menuType" | "variant" | "settings">,
) {
  if (
    row.consumed ||
    row.state.menuType !== request.menuType ||
    row.state.variant !== request.variant ||
    !isDeepStrictEqual(row.state.settings, request.settings)
  )
    return undefined;
  return attemptEntry(row.id, row.state);
}

/** 確定結果を `finishAttempt` の戻り値の形にする。何も記録しなかったら undefined。 */
export function outcomeResult(
  outcome: ChallengeOutcome,
):
  | { readonly grantedRanks: readonly RankSlug[] }
  | { readonly challengeResultId: string }
  | undefined {
  switch (outcome.kind) {
    case "graded":
      return { grantedRanks: outcome.grantedRanks };
    case "recorded":
      return { challengeResultId: outcome.challengeResultId };
    case "unrecorded":
      return undefined;
    default: {
      const exhaustive: never = outcome;
      return exhaustive;
    }
  }
}

/**
 * 確定結果を `finishAttempt` の戻り値にする。記録した練習には土俵（練習種別と
 * バリアント）を添える — 呼び出し側が今回の成績を過去の記録と比べるとき
 * （`getScoreComparison`）に、行を読み直さずに済むようにするため。
 */
export function finishResult(state: ChallengeState, outcome: ChallengeOutcome) {
  const result = outcomeResult(outcome);
  return result !== undefined && "challengeResultId" in result
    ? { ...result, menuType: state.menuType, variant: state.variant }
    : result;
}

/**
 * 挑戦の今の状態の応答（`readAttemptStatus`）。今の問題は正解を伏せ、
 * 確定済みなら確定の結果も添える。時計はサーバーの値 `now` だけで組む。
 */
export function attemptStatus(row: AttemptRow, now: number) {
  const { state } = row;
  return {
    ...attemptEntry(row.id, state),
    menuType: state.menuType,
    variant: state.variant,
    // 採点の条件。復帰した端末は手元の設定ではなくこれで表示し直す
    settings: state.settings,
    score: state.score,
    incorrectAnswers: state.incorrectAnswers,
    elapsedMs: challengeElapsed(state, now),
    remainingMs: challengeRemainingMs(state, now),
    paused: state.paused,
    finished: row.consumed,
    outcome: row.consumed
      ? outcomeResult(state.outcome ?? { kind: "unrecorded" })
      : undefined,
  };
}
