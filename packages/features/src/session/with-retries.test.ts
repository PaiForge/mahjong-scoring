import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withRetries } from "./with-retries";

type Outcome = { readonly ok: true } | { readonly error: string };

const retryOnError = (result: Outcome) => "error" in result;

describe("withRetries", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("送り直さなくてよい結果はそのまま返す", async () => {
    const send = vi
      .fn<() => Promise<Outcome>>()
      .mockResolvedValue({ ok: true });
    await expect(withRetries(send, retryOnError)).resolves.toEqual({
      ok: true,
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("送り直してよい結果は間を空けて送り直し、通った結果を返す", async () => {
    const send = vi
      .fn<() => Promise<Outcome>>()
      .mockResolvedValueOnce({ error: "network" })
      .mockResolvedValueOnce({ error: "network" })
      .mockResolvedValue({ ok: true });

    const promise = withRetries(send, retryOnError, [100, 200]);
    await vi.advanceTimersByTimeAsync(0);
    expect(send).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(99);
    expect(send).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(send).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(200);
    expect(send).toHaveBeenCalledTimes(3);
    await expect(promise).resolves.toEqual({ ok: true });
  });

  it("待ち時間の列を使い切ったら最後の結果を返す", async () => {
    const send = vi
      .fn<() => Promise<Outcome>>()
      .mockResolvedValue({ error: "network" });

    const promise = withRetries(send, retryOnError, [10, 10]);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ error: "network" });
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("送り直してはいけない結果は待たずに返す", async () => {
    const send = vi
      .fn<() => Promise<Outcome>>()
      .mockResolvedValue({ error: "rejected" });

    await expect(
      withRetries(
        send,
        (result) => "error" in result && result.error === "network",
      ),
    ).resolves.toEqual({ error: "rejected" });
    expect(send).toHaveBeenCalledTimes(1);
  });
});
