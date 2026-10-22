import { useCallback, useRef, useState, type RefObject } from "react";
import type { MobileChallengeStatus } from "@mahjong-scoring/features/challenge/mobile-api";

import { isRetryableFailure } from "../records/failure-policy";
import { pauseRecordedChallenge } from "../records/records-api";
import { withRetries } from "../records/with-retries";
import type { ReconnectPrompt } from "./use-reconnect-prompt";

/**
 * サーバーの一時停止を画面の状態に合わせる
 * 一時停止の同期
 *
 * 停止・再開は 1 本の処理で順に送り、送るのはその時点の画面の状態だけ
 * （連打しても届く順が入れ替わらない）。止める要求が届かなくても画面は
 * 止めておく（サーバーの時計は進み、再開のときに合わせる）。再開は
 * サーバーが動き出したと確かめるまで回答を受け付けず、届かなければ
 * 再接続の案内を出す（サーバーが止まったままだと回答が断られる）。
 *
 * 画面の操作と時計を止める（`resuming`）のは再開を送るときだけ。止める要求は
 * 届くのを待たずに画面を止めており、送っている間に押せなくする理由が無い
 * （中止の確認を開いた瞬間に画面全体を押せなくすることにもなる）。
 */
export function useServerPauseSync({
  userId,
  attemptId,
  pending,
  resync,
  waitForReconnect,
}: {
  readonly userId: string;
  readonly attemptId: string;
  /** 送っている回答の応答。停止・再開はこれを待ってから送る */
  readonly pending: RefObject<Promise<void> | undefined>;
  /** サーバーの状態を読んで時計と問題を合わせ直す。読めなければ undefined */
  readonly resync: () => Promise<MobileChallengeStatus | undefined>;
  readonly waitForReconnect: (
    message: ReconnectPrompt["message"],
  ) => Promise<void>;
}): {
  /** 再開をサーバーへ伝えている間 true。この間は回答を受け付けず時計も止める */
  readonly resuming: boolean;
  /** 画面の一時停止の状態を変え、サーバーへ伝え始める */
  readonly pause: (paused: boolean) => void;
  /** 停止・再開を送っている途中か */
  readonly isSyncing: () => boolean;
  /**
   * 回答が断られてサーバーの状態を読み直したときに呼ぶ。サーバーが止まったまま
   * （別の端末で止めた等）で画面が動いているなら、動かし直す要求を送る
   */
  readonly recoverFromServerPaused: (
    status: MobileChallengeStatus | undefined,
  ) => void;
} {
  const [resuming, setResuming] = useState(false);
  /** 画面が止まっているか（サーバーへ伝えたい一時停止の状態） */
  const wantPaused = useRef(false);
  /** サーバーが受け付けたと確かめた一時停止の状態（サーバーの状態を読むたびに写す） */
  const serverPaused = useRef(false);
  /** 一時停止・再開をサーバーへ伝えている処理（同時に 1 本だけ） */
  const pauseSync = useRef<Promise<void> | undefined>(undefined);

  const syncPause = useCallback(async (): Promise<void> => {
    let attempts = 0;
    while (serverPaused.current !== wantPaused.current) {
      await pending.current;
      const desired = wantPaused.current;
      const sent = await withRetries(() =>
        pauseRecordedChallenge(userId, attemptId, desired),
      );
      const unreachable = "error" in sent && isRetryableFailure(sent.error);
      if (desired) {
        // 届かなくても止まったものとして扱う。再開のときに送り直し、
        // サーバーの時計に合わせる
        serverPaused.current = true;
        continue;
      }
      // 再開: 受け付けられても断られても、サーバーの今の状態を読んで合わせる
      const status = unreachable ? undefined : await resync();
      if (status !== undefined) serverPaused.current = status.paused;
      if (status?.finished) {
        // 時間切れは `resync` が時計に写した。送るものはもう無い
        serverPaused.current = wantPaused.current;
        return;
      }
      if (status === undefined || (status.paused && ++attempts >= 3)) {
        attempts = 0;
        await waitForReconnect("resumeConnectionLost");
      }
    }
  }, [userId, attemptId, pending, resync, waitForReconnect]);

  /** 同期を始める（走っていれば、その処理が最新の状態まで送る） */
  const startPauseSync = useCallback(
    function start(): void {
      if (!wantPaused.current) setResuming(true);
      if (pauseSync.current) return;
      pauseSync.current = syncPause().finally(() => {
        pauseSync.current = undefined;
        setResuming(false);
        // 終わる直前に状態が変わっていたら、もう 1 度送る
        if (serverPaused.current !== wantPaused.current) start();
      });
    },
    [syncPause],
  );

  const pause = useCallback(
    (paused: boolean) => {
      wantPaused.current = paused;
      startPauseSync();
    },
    [startPauseSync],
  );

  const recoverFromServerPaused = useCallback(
    (status: MobileChallengeStatus | undefined) => {
      if (status !== undefined) serverPaused.current = status.paused;
      if (status?.paused && !wantPaused.current) startPauseSync();
    },
    [startPauseSync],
  );

  return {
    resuming,
    pause,
    isSyncing: () => pauseSync.current !== undefined,
    recoverFromServerPaused,
  };
}
