import { describe, expect, it } from "vitest";

import {
  canDropActiveChallenge,
  decidePendingFinish,
  decidePendingFinishByStatus,
  isSettled,
} from "./failure-policy";
import type { RecordsApiFailure } from "./records-api";

describe("isSettled", () => {
  it.each<[RecordsApiFailure, boolean]>([
    ["notFinished", true],
    ["invalidChallenge", true],
    ["conflict", true],
    ["invalidRequest", true],
    ["network", false],
    ["serverError", false],
    ["authUnavailable", false],
    ["rateLimited", false],
  ])("%s → %s", (error, expected) => {
    expect(isSettled(error)).toBe(expected);
  });
});

describe("decidePendingFinish", () => {
  it("確定できたら記録済みとして外す", () => {
    expect(decidePendingFinish({ value: {} })).toBe("recorded");
  });

  it("通信できないなら残して打ち切る", () => {
    expect(decidePendingFinish({ error: "network" })).toBe("stop");
    expect(decidePendingFinish({ error: "serverError" })).toBe("stop");
  });

  it("まだ終わっていないなら状態を読んで決める", () => {
    expect(decidePendingFinish({ error: "notFinished" })).toBe("checkStatus");
  });

  it("記録できない・見つからないなら記録せずに外す", () => {
    expect(decidePendingFinish({ error: "invalidChallenge" })).toBe("drop");
    expect(decidePendingFinish({ error: "conflict" })).toBe("drop");
  });
});

describe("decidePendingFinishByStatus", () => {
  it("時間が残っていて止まっていなければ、期限まで残す", () => {
    expect(
      decidePendingFinishByStatus({
        value: { paused: false, remainingMs: 1000 },
      }),
    ).toBe("keep");
  });

  it("一時停止中なら外す", () => {
    expect(
      decidePendingFinishByStatus({
        value: { paused: true, remainingMs: 1000 },
      }),
    ).toBe("drop");
  });

  it("時間が残っていなければ外す", () => {
    expect(
      decidePendingFinishByStatus({ value: { paused: false, remainingMs: 0 } }),
    ).toBe("drop");
  });

  it("状態を読めず通信できないなら打ち切る", () => {
    expect(decidePendingFinishByStatus({ error: "network" })).toBe("stop");
  });

  it("状態を読めないがサーバーが答えたなら、残して先へ進む", () => {
    expect(decidePendingFinishByStatus({ error: "invalidChallenge" })).toBe(
      "keep",
    );
  });
});

describe("canDropActiveChallenge", () => {
  it("確定できた・もう送っても変わらないなら外す", () => {
    expect(canDropActiveChallenge({ value: {} })).toBe(true);
    expect(canDropActiveChallenge({ error: "notFinished" })).toBe(true);
  });

  it("通信できないなら残す", () => {
    expect(canDropActiveChallenge({ error: "network" })).toBe(false);
  });
});
