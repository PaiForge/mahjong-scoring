// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const touched = vi.hoisted(() => vi.fn());

vi.mock("../db", async () => ({
  ...(await import("../db/schema")),
  // 停止中に DB へ触れたら分かるように、どの操作も記録して投げる
  db: new Proxy(
    {},
    {
      get: (_, property) => {
        touched(property);
        throw new Error("DB must not be touched");
      },
    },
  ),
}));

import { getDailyProblem, isDailyProblemDisabled } from "./today";

afterEach(() => {
  vi.unstubAllEnvs();
  touched.mockClear();
});

describe("isDailyProblemDisabled", () => {
  it('DAILY_PROBLEM_DISABLED が "1" のときだけ止める', () => {
    vi.stubEnv("DAILY_PROBLEM_DISABLED", "1");
    expect(isDailyProblemDisabled()).toBe(true);
    vi.stubEnv("DAILY_PROBLEM_DISABLED", "true");
    expect(isDailyProblemDisabled()).toBe(false);
    vi.stubEnv("DAILY_PROBLEM_DISABLED", "");
    expect(isDailyProblemDisabled()).toBe(false);
  });
});

describe("getDailyProblem", () => {
  it("停止中は DB を読まずに問題なしを返す", async () => {
    vi.stubEnv("DAILY_PROBLEM_DISABLED", "1");
    expect(await getDailyProblem(new Date())).toBeUndefined();
    expect(touched).not.toHaveBeenCalled();
  });

  it("DB の失敗は握り潰さずに投げる", async () => {
    vi.stubEnv("DAILY_PROBLEM_DISABLED", "");
    await expect(getDailyProblem(new Date())).rejects.toThrow(
      "DB must not be touched",
    );
  });
});
