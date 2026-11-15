import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createProblemArchiveQueue,
  type ArchiveSendOutcome,
} from "./problem-archive-queue";

/** 1 回の send 呼び出し。結果は resolve / reject で後から決める */
interface SendCall {
  readonly item: string;
  readonly signal: AbortSignal;
  readonly resolve: (outcome: ArchiveSendOutcome) => void;
  readonly reject: (error: unknown) => void;
}

/** 結果を手で決められる send */
function createControlledSend() {
  const calls: SendCall[] = [];
  let inFlight = 0;
  let maxInFlight = 0;
  const send = (item: string, signal: AbortSignal) =>
    new Promise<ArchiveSendOutcome>((resolve, reject) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      const finish = () => {
        inFlight -= 1;
      };
      calls.push({
        item,
        signal,
        resolve: (outcome) => {
          finish();
          resolve(outcome);
        },
        reject: (error) => {
          finish();
          reject(error);
        },
      });
    });
  return {
    send,
    calls,
    sentItems: () => calls.map((call) => call.item),
    maxInFlight: () => maxInFlight,
  };
}

/** 保留中の Promise の続きを流す（時間は進めない） */
async function flush(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
}

beforeEach(() => {
  vi.useFakeTimers();
  // 送り直しの待ちを下限の 200ms に固定する
  vi.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("問題蓄積の送信キュー", () => {
  it("待ちが上限に達したら、新しく来た項目を捨てる（送信中の 1 件は数えない）", async () => {
    const { send, calls, sentItems } = createControlledSend();
    const queue = createProblemArchiveQueue({ send, maxPending: 2 });

    for (const item of ["a", "b", "c", "d"]) queue.enqueue(item);
    await flush();
    for (let i = 0; i < 3; i += 1) {
      calls[i].resolve("done");
      await flush();
    }

    expect(sentItems()).toEqual(["a", "b", "c"]);
  });

  it("既定の待ちの上限は 8 件", async () => {
    const { send, calls, sentItems } = createControlledSend();
    const queue = createProblemArchiveQueue({ send });

    for (let i = 0; i < 10; i += 1) queue.enqueue(`q${i}`);
    await flush();
    for (let i = 0; i < 9; i += 1) {
      calls[i].resolve("done");
      await flush();
    }

    expect(sentItems()).toHaveLength(9);
    expect(sentItems()).not.toContain("q9");
  });

  it("同時に送るのは 1 件だけで、終わってから次を送る", async () => {
    const control = createControlledSend();
    const queue = createProblemArchiveQueue({ send: control.send });

    queue.enqueue("a");
    queue.enqueue("b");
    queue.enqueue("c");
    await flush();
    expect(control.sentItems()).toEqual(["a"]);

    control.calls[0].resolve("done");
    await flush();
    expect(control.sentItems()).toEqual(["a", "b"]);

    control.calls[1].resolve("drop");
    await flush();
    control.calls[2].resolve("done");
    await flush();

    expect(control.sentItems()).toEqual(["a", "b", "c"]);
    expect(control.maxInFlight()).toBe(1);
  });

  it("制限時間を過ぎたら中断を伝え、send が応じなくても送り直しを経て次へ進む", async () => {
    const { send, calls, sentItems } = createControlledSend();
    const queue = createProblemArchiveQueue({ send, timeoutMs: 5000 });

    queue.enqueue("a");
    queue.enqueue("b");
    await flush();
    await vi.advanceTimersByTimeAsync(4999);
    expect(calls[0].signal.aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(calls[0].signal.aborted).toBe(true);

    // 送り直しも応じないまま制限時間を過ぎる
    await vi.advanceTimersByTimeAsync(200);
    expect(sentItems()).toEqual(["a", "a"]);
    await vi.advanceTimersByTimeAsync(5000);

    expect(calls[1].signal.aborted).toBe(true);
    expect(sentItems()).toEqual(["a", "a", "b"]);
  });

  it("制限時間の後に届いた結果は無視する", async () => {
    const { send, calls, sentItems } = createControlledSend();
    const queue = createProblemArchiveQueue({ send, timeoutMs: 100 });

    queue.enqueue("a");
    await flush();
    await vi.advanceTimersByTimeAsync(100);
    calls[0].resolve("done");
    await vi.advanceTimersByTimeAsync(200);

    // 1 回目は時間切れ = 失敗として扱われ、送り直している
    expect(sentItems()).toEqual(["a", "a"]);
  });

  it("retry は 200〜1000ms 待ってから 1 回だけ送り直し、2 回目も失敗なら捨てる", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const { send, calls, sentItems } = createControlledSend();
    const queue = createProblemArchiveQueue({ send });

    queue.enqueue("a");
    queue.enqueue("b");
    await flush();
    calls[0].resolve("retry");
    await vi.advanceTimersByTimeAsync(599);
    expect(sentItems()).toEqual(["a"]);

    await vi.advanceTimersByTimeAsync(1);
    expect(sentItems()).toEqual(["a", "a"]);

    calls[1].resolve("retry");
    await flush();

    expect(sentItems()).toEqual(["a", "a", "b"]);
  });

  it("送り直しの待ちは乱数が最大でも 1000ms を超えない", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    const { send, calls, sentItems } = createControlledSend();
    const queue = createProblemArchiveQueue({ send });

    queue.enqueue("a");
    await flush();
    calls[0].resolve("retry");
    await vi.advanceTimersByTimeAsync(1000);

    expect(sentItems()).toEqual(["a", "a"]);
  });

  it("send の例外（同期・非同期）も retry と同じく 1 回だけ送り直す", async () => {
    const items: string[] = [];
    const queue = createProblemArchiveQueue<string>({
      send: (item) => {
        items.push(item);
        if (item === "sync") throw new Error("sync failure");
        return Promise.reject(new Error("async failure"));
      },
    });

    queue.enqueue("sync");
    queue.enqueue("async");
    await vi.runAllTimersAsync();

    expect(items).toEqual(["sync", "sync", "async", "async"]);
  });

  it("drop は送り直さない", async () => {
    const { send, calls, sentItems } = createControlledSend();
    const queue = createProblemArchiveQueue({ send });

    queue.enqueue("a");
    queue.enqueue("b");
    await flush();
    calls[0].resolve("drop");
    await flush();

    expect(sentItems()).toEqual(["a", "b"]);
    calls[1].resolve("done");
    await vi.runAllTimersAsync();
    expect(sentItems()).toEqual(["a", "b"]);
  });

  it("失敗し続けても、失敗した項目を待ちへ戻さない（待ちが増えない）", async () => {
    const { send, calls, sentItems } = createControlledSend();
    const queue = createProblemArchiveQueue({ send, maxPending: 2 });

    // a を送信中、b・c で待ちは満杯
    for (const item of ["a", "b", "c"]) queue.enqueue(item);
    await flush();
    calls[0].resolve("retry");
    await vi.advanceTimersByTimeAsync(200);
    calls[1].resolve("retry");
    await flush();
    // a を捨てて b の送信に移ったので、待ちは c だけ。1 件ぶん空いている
    expect(sentItems()).toEqual(["a", "a", "b"]);
    queue.enqueue("x");
    queue.enqueue("y");

    for (let i = 2; i < 10 && i < calls.length; i += 1) {
      calls[i].resolve("retry");
      await vi.advanceTimersByTimeAsync(200);
    }
    await vi.runAllTimersAsync();

    expect(sentItems()).toEqual(["a", "a", "b", "b", "c", "c", "x", "x"]);
  });

  it("enqueue は send が投げても上限を超えても投げない", () => {
    const queue = createProblemArchiveQueue<string>({
      send: () => {
        throw new Error("boom");
      },
      maxPending: 1,
    });

    expect(() => {
      for (let i = 0; i < 5; i += 1) queue.enqueue(`q${i}`);
    }).not.toThrow();
  });
});
