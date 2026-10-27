import { describe, expect, it } from "vitest";
import {
  isRetryableFinishFailure,
  type FinishErrorCode,
} from "./finish-failure-policy";

describe("isRetryableFinishFailure", () => {
  it.each<[FinishErrorCode, boolean]>([
    ["rateLimited", true],
    ["unexpectedError", true],
    ["authUnavailable", true],
    ["banned", false],
    ["invalidResult", false],
  ])("%s → %s", (error, expected) => {
    expect(isRetryableFinishFailure(error)).toBe(expected);
  });
});
