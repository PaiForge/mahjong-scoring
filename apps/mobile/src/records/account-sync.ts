import { create } from "zustand";
import type { ExpInfo } from "@mahjong-scoring/core";
import type { MobileFinishChallengeResponse } from "@mahjong-scoring/features/challenge/mobile-api";
import type { BuildJourneyInput } from "@mahjong-scoring/features/journey/journey";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

import { onAccountDeleted } from "../auth/api-client";
import { useLessonCompletionStore } from "../hooks/use-lesson-completion-store";
import {
  dropActiveChallenge,
  dropPendingFinish,
  finishChallenge,
  importGuestLessons,
  purgeUser,
  recordsOf,
  removePendingLessons,
  type ActiveChallenge,
  type PendingFinish,
} from "./account-records";
import {
  answerRecordedChallenge,
  fetchProgress,
  finishRecordedChallenge,
  readRecordedChallenge,
  sendLessonCompletions,
} from "./records-api";
import {
  canDropActiveChallenge,
  decidePendingFinish,
  decidePendingFinishByStatus,
  isRetryableFailure,
  isSettled,
} from "./failure-policy";
import {
  accountRecordsHydrated,
  updateAccountRecords,
  useAccountRecordsStore,
} from "./use-account-records-store";

/**
 * サーバーから読んだ本人の進み具合（メモリのみ）
 *
 * 読んだときのユーザーを一緒に持ち、別のユーザーの値を見せない。
 */
interface ProgressState {
  readonly userId: string | undefined;
  readonly input: BuildJourneyInput | undefined;
}

/** 進み具合のキャッシュ */
export const useServerProgressStore = create<ProgressState>(() => ({
  userId: undefined,
  input: undefined,
}));

/** 今の画面が解いているチャレンジ（後始末の対象から外す） */
const liveAttemptIds = new Set<string>();

/**
 * 画面がこのチャレンジを解いている間、起動時の後始末の対象から外す。解除する関数を返す
 * 解答中チャレンジ登録
 */
export function markAttemptLive(attemptId: string): () => void {
  liveAttemptIds.add(attemptId);
  return () => liveAttemptIds.delete(attemptId);
}

/**
 * 本人の進み具合をサーバーから読み直す
 * 進み具合再取得
 *
 * 読んでいる間に別のユーザーへ切り替わったら、結果を捨てる（呼び出し側が
 * 今のユーザーかを確かめる必要は無い — `asUser` で送り、違えば送らない）。
 */
export async function refreshServerProgress(userId: string): Promise<void> {
  const result = await fetchProgress(userId);
  if ("value" in result)
    useServerProgressStore.setState({ userId, input: result.value });
}

/** 送り直しの最中のユーザー（同じユーザーで重ねて走らせない） */
const running = new Map<string, Promise<void>>();
/** 走っている間に次の依頼が来た（終わったらもう 1 周する） */
const requestedAgain = new Set<string>();

/**
 * 預けた記録を送り、進み具合を読み直す
 * アカウント記録同期
 *
 * ログイン時・アプリが前面に戻ったとき・チャレンジの確定やレッスンの完了の
 * 後に呼ぶ。同じユーザーで走っている最中に呼ばれたら、終わってからもう
 * 1 周する。送れなかったものは預けたまま次の機会に回す。ゲストの
 * レッスン完了の取り込み（端末で 1 度だけ）もここで行う。
 */
export function syncAccountRecords(userId: string): Promise<void> {
  const current = running.get(userId);
  if (current) {
    requestedAgain.add(userId);
    return current;
  }
  const run = (async () => {
    try {
      do {
        requestedAgain.delete(userId);
        await syncOnce(userId);
      } while (requestedAgain.has(userId));
    } finally {
      running.delete(userId);
    }
  })();
  running.set(userId, run);
  return run;
}

async function syncOnce(userId: string): Promise<void> {
  await Promise.all([accountRecordsHydrated(), guestLessonsHydrated()]);
  updateAccountRecords((records) =>
    importGuestLessons(
      records,
      userId,
      useLessonCompletionStore.getState().completedSlugs,
    ),
  );
  await recoverActiveChallenge(userId);
  await sendPendingFinishes(userId);
  await sendPendingLessons(userId);
  await refreshServerProgress(userId);
}

/** ゲストのレッスン完了を保存先から読み終えるまで待つ */
function guestLessonsHydrated(): Promise<void> {
  const { persist: store } = useLessonCompletionStore;
  if (store.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = store.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

function recordsFor(userId: string) {
  return recordsOf(useAccountRecordsStore.getState(), userId);
}

/**
 * 画面が閉じられた（アプリが落ちた）ときに解いていたチャレンジの後始末
 *
 * 未確認の回答があれば送り直し、サーバー上で終わっている（時間切れ・
 * ミスの上限）なら確定して記録する。時間が残っている・一時停止中のものは
 * 中止として捨てる — 解答の画面へは戻さない（web でタブを閉じたときと同じく、
 * 途中で抜けたチャレンジは記録しない）。
 */
async function recoverActiveChallenge(userId: string): Promise<void> {
  const active: ActiveChallenge | undefined = recordsFor(userId).active;
  if (!active || liveAttemptIds.has(active.attemptId)) return;
  if (active.pendingAnswer) {
    const answered = await answerRecordedChallenge(
      userId,
      active.attemptId,
      active.pendingAnswer.sequence,
      active.pendingAnswer.answer,
    );
    if ("error" in answered && isRetryableFailure(answered.error)) return;
  }
  const finished = await finishRecordedChallenge(userId, active.attemptId);
  if (!canDropActiveChallenge(finished)) return;
  updateAccountRecords((records) =>
    dropActiveChallenge(records, userId, active.attemptId),
  );
}

/** 終わったが確定を受け取れていないチャレンジを確定し直す */
async function sendPendingFinishes(userId: string): Promise<void> {
  for (const pending of recordsFor(userId).pendingFinishes) {
    if (!(await sendPendingFinish(userId, pending))) return;
  }
}

/** 確定し直す。先へ進めてよければ true（通信できないなら false で打ち切る） */
async function sendPendingFinish(
  userId: string,
  pending: PendingFinish,
): Promise<boolean> {
  const finished = await finishRecordedChallenge(userId, pending.attemptId);
  const first = decidePendingFinish(finished);
  const decision =
    first === "checkStatus"
      ? decidePendingFinishByStatus(
          await readRecordedChallenge(userId, pending.attemptId),
        )
      : first;
  switch (decision) {
    case "recorded":
      setFinishStatus(
        pending.attemptId,
        "recorded",
        "value" in finished ? finished.value : undefined,
      );
      dropPending(userId, pending.attemptId);
      return true;
    case "drop":
      dropPending(userId, pending.attemptId);
      return true;
    case "keep":
      return true;
    case "stop":
      return false;
    default: {
      const exhaustive: never = decision;
      return exhaustive;
    }
  }
}

function dropPending(userId: string, attemptId: string): void {
  updateAccountRecords((records) =>
    dropPendingFinish(records, userId, attemptId),
  );
}

/** 未送信のレッスンの完了を送る */
async function sendPendingLessons(userId: string): Promise<void> {
  for (;;) {
    const pending = recordsFor(userId).pendingLessons;
    if (pending.length === 0) return;
    const result = await sendLessonCompletions(userId, pending);
    if ("error" in result) return;
    const done = [...result.value.completed, ...result.value.rejected];
    if (done.length === 0) return;
    updateAccountRecords((records) =>
      removePendingLessons(records, userId, done),
    );
  }
}

// 退会を受け付けたアカウントの預かりとキャッシュを消す（この端末から
// 送ることはもう無い。受け付けた後の書き込みはサーバーも拒む）
onAccountDeleted((userId) => {
  updateAccountRecords((records) => purgeUser(records, userId));
  if (useServerProgressStore.getState().userId === userId)
    useServerProgressStore.setState({ userId: undefined, input: undefined });
});

/**
 * 確定の送信の状態（結果画面の表示用）
 *
 * - `sending` — 送っている
 * - `recorded` — 成績を記録した（昇級試験は合否を判定した）
 * - `queued` — 送れなかった。預けておき、次に通信できたときに送る
 * - `notRecorded` — 記録されない（サーバーが記録できないと答えた）
 */
export type FinishStatus = "sending" | "recorded" | "queued" | "notRecorded";

const useFinishStatusStore = create<{
  readonly byAttempt: Readonly<Record<string, FinishStatus>>;
  /** 記録できたチャレンジに付いた経験値（対象外の練習には無い） */
  readonly expByAttempt: Readonly<Record<string, ExpInfo>>;
  /** 判定した昇級試験で付与した段級位（不合格・再挑戦なら空） */
  readonly grantedRanksByAttempt: Readonly<Record<string, readonly RankSlug[]>>;
}>(() => ({ byAttempt: {}, expByAttempt: {}, grantedRanksByAttempt: {} }));

function setFinishStatus(
  attemptId: string,
  status: FinishStatus,
  response?: MobileFinishChallengeResponse,
): void {
  useFinishStatusStore.setState((state) => ({
    byAttempt: { ...state.byAttempt, [attemptId]: status },
    ...(response !== undefined && "exp" in response && response.exp
      ? { expByAttempt: { ...state.expByAttempt, [attemptId]: response.exp } }
      : {}),
    ...(response !== undefined && "grantedRanks" in response
      ? {
          grantedRanksByAttempt: {
            ...state.grantedRanksByAttempt,
            [attemptId]: response.grantedRanks,
          },
        }
      : {}),
  }));
}

/**
 * チャレンジの確定の送信の状態を読む
 * 確定状態参照
 */
export function useFinishStatus(
  attemptId: string | undefined,
): FinishStatus | undefined {
  return useFinishStatusStore((state) =>
    attemptId === undefined ? undefined : state.byAttempt[attemptId],
  );
}

/**
 * 記録できたチャレンジに付いた経験値を読む
 * 獲得経験値参照
 *
 * 確定の応答に載った値（web の結果ページと同じ `ExpInfo`）。まだ記録できて
 * いない・経験値の対象外の練習・古いサーバーなら undefined。
 */
export function useFinishExp(
  attemptId: string | undefined,
): ExpInfo | undefined {
  return useFinishStatusStore((state) =>
    attemptId === undefined ? undefined : state.expByAttempt[attemptId],
  );
}

/**
 * 判定した昇級試験で付与した段級位を読む
 * 付与段級位参照
 *
 * まだ判定を受け取れていない・練習のチャレンジなら undefined。不合格や
 * 既に持っている級の再挑戦は空の配列。
 */
export function useFinishGrantedRanks(
  attemptId: string | undefined,
): readonly RankSlug[] | undefined {
  return useFinishStatusStore((state) =>
    attemptId === undefined
      ? undefined
      : state.grantedRanksByAttempt[attemptId],
  );
}

/**
 * 終わったチャレンジを確定待ちへ移し、確定を送る
 * チャレンジ確定送信
 *
 * 送る前に確定待ちへ預けるので、応答を失ってもアプリが落ちても、次の
 * 同期（`syncAccountRecords`）が送り直す（サーバーの確定は冪等）。
 */
export async function submitChallengeFinish(
  userId: string,
  challenge: PendingFinish,
): Promise<void> {
  updateAccountRecords((records) =>
    finishChallenge(records, userId, challenge),
  );
  setFinishStatus(challenge.attemptId, "sending");
  let result = await finishRecordedChallenge(userId, challenge.attemptId);
  for (const delay of [1000, 2000]) {
    if (!("error" in result) || !isRetryableFailure(result.error)) break;
    await new Promise((resolve) => setTimeout(resolve, delay));
    result = await finishRecordedChallenge(userId, challenge.attemptId);
  }
  if ("value" in result) {
    updateAccountRecords((records) =>
      dropPendingFinish(records, userId, challenge.attemptId),
    );
    setFinishStatus(challenge.attemptId, "recorded", result.value);
    void refreshServerProgress(userId);
    return;
  }
  if (isSettled(result.error) && result.error !== "notFinished") {
    updateAccountRecords((records) =>
      dropPendingFinish(records, userId, challenge.attemptId),
    );
    setFinishStatus(challenge.attemptId, "notRecorded");
    return;
  }
  setFinishStatus(challenge.attemptId, "queued");
}
