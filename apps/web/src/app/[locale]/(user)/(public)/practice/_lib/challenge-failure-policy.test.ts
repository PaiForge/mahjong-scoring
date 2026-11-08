import { describe, expect, it } from "vitest";
import {
  isRetryableChallengeFailure,
  type ChallengeFailureCode,
} from "./challenge-failure-policy";

describe("isRetryableChallengeFailure", () => {
  it.each<[ChallengeFailureCode, boolean]>([
    ["rateLimited", true],
    ["unexpectedError", true],
    ["authUnavailable", true],
    ["banned", false],
    ["unauthorized", false],
    ["invalidResult", false],
    ["rejected", false],
  ])("%s → %s", (error, expected) => {
    expect(isRetryableChallengeFailure(error)).toBe(expected);
  });
});
