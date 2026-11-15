/**
 * 出題した問題を蓄積先へ送る、有界の送信キュー
 * 問題蓄積の送信キュー
 *
 * 練習を止めないことを最優先にし、送信は取りこぼしてよいものとして扱う。
 *
 * - 同時に送るのは 1 件だけ。待ち（送信中の 1 件を含まない）は既定で最大 8 件で、
 *   満杯のときは新しく来た方を捨てる
 * - 1 試行は既定で 5 秒。過ぎたら `AbortSignal` で中断を伝え、`send` が応じるのを
 *   待たずに次へ進む（その試行は通信失敗と同じに扱う）
 * - 送り直すのは通信失敗・5xx（`"retry"`）と `send` の例外だけで、1 回限り。
 *   送り直す前に 200〜1000ms の乱数の待ちを入れ、同時に失敗した端末の再送が
 *   重ならないようにする。4xx・429・未ログイン（`"drop"`）は送り直さない
 * - 永続の outbox は作らない。画面を閉じれば待ちは消える
 *
 * このため保存された件数は出題回数や出題の分布を表さない。採用の通知は
 * 1 回の生成につき 1 回なので、二重登録を防ぐ仕組みも持たない。
 *
 * React・zustand に依存しない純粋なモジュール。ストアのことも知らず、
 * 送る中身と送り方は呼び出し側が `send` で決める。
 */

/**
 * 1 件の送信の結果
 * 送信結果
 *
 * - `"done"`: 送れた
 * - `"retry"`: 通信失敗・5xx。1 回だけ送り直す
 * - `"drop"`: 4xx・429・未ログイン。送り直さず捨てる
 */
export type ArchiveSendOutcome = "done" | "retry" | "drop";

/**
 * 問題蓄積の送信キュー
 */
export interface ProblemArchiveQueue<T> {
  /**
   * 送る項目を待ちに入れる（同期で、投げない）
   *
   * 待ちが上限に達していれば何もせず捨てる。
   */
  enqueue(item: T): void;
}

/** 待ちの上限の既定値（送信中の 1 件を含まない） */
const DEFAULT_MAX_PENDING = 8;
/** 1 試行の制限時間の既定値（ミリ秒） */
const DEFAULT_TIMEOUT_MS = 5000;
/** 送り直す前の待ちの下限（ミリ秒） */
const RETRY_DELAY_MIN_MS = 200;
/** 送り直す前の待ちの上限（ミリ秒） */
const RETRY_DELAY_MAX_MS = 1000;

/**
 * 問題蓄積の送信キューを作る
 * 送信キュー生成
 *
 * 待ちの時間は `setTimeout`、送り直しの待ちの乱数は `Math.random` で決める
 * （テストでは fake timers と `Math.random` の差し替えで制御する）。
 *
 * @param options.send 1 件送る。`"done"` は成功、`"retry"` は通信失敗・5xx、
 *   `"drop"` は 4xx・429・未ログイン。渡された `signal` が中断されたら
 *   送信をやめてよい（応じなくてもキューは次へ進む）
 * @param options.maxPending 待ちの上限（既定 8。送信中の 1 件を含まない）
 * @param options.timeoutMs 1 試行の制限時間（既定 5000ms）
 */
export function createProblemArchiveQueue<T>(options: {
  /** 1 件送る。"done" は成功、"retry" は通信失敗・5xx、"drop" は 4xx・429・未ログイン */
  send: (item: T, signal: AbortSignal) => Promise<ArchiveSendOutcome>;
  maxPending?: number;
  timeoutMs?: number;
}): ProblemArchiveQueue<T> {
  const { send } = options;
  const maxPending = options.maxPending ?? DEFAULT_MAX_PENDING;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  // 項目を包んで持つ。T が undefined を含んでも「待ちが空」と区別できるようにする
  const pending: { readonly item: T }[] = [];
  let isSending = false;

  /** 1 試行。制限時間を過ぎたら中断を伝え、結果を待たずに "retry" とする */
  function attempt(item: T): Promise<ArchiveSendOutcome> {
    const controller = new AbortController();
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        controller.abort();
        resolve("retry");
      }, timeoutMs);
      const settle = (outcome: ArchiveSendOutcome) => {
        clearTimeout(timer);
        resolve(outcome);
      };
      try {
        send(item, controller.signal).then(settle, () => settle("retry"));
      } catch {
        settle("retry");
      }
    });
  }

  /** 送り直しの前の待ち（200〜1000ms の乱数） */
  function waitBeforeRetry(): Promise<void> {
    const delay =
      RETRY_DELAY_MIN_MS +
      Math.random() * (RETRY_DELAY_MAX_MS - RETRY_DELAY_MIN_MS);
    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }

  /** 1 件を送り切る。"retry" なら 1 回だけ送り直し、それでも駄目なら捨てる */
  async function deliver(item: T): Promise<void> {
    if ((await attempt(item)) !== "retry") return;
    await waitBeforeRetry();
    await attempt(item);
  }

  /** 待ちを 1 件ずつ送る。送信中なら何もしない（同時 1 件） */
  async function drain(): Promise<void> {
    if (isSending) return;
    isSending = true;
    try {
      for (
        let entry = pending.shift();
        entry !== undefined;
        entry = pending.shift()
      ) {
        await deliver(entry.item);
      }
    } finally {
      isSending = false;
    }
  }

  return {
    enqueue(item) {
      if (pending.length >= maxPending) return;
      pending.push({ item });
      drain().catch((error: unknown) => {
        // deliver は失敗を結果に畳むので通常は来ない。来ても練習は止めない
        console.warn("problem archive queue failed", error);
      });
    },
  };
}
