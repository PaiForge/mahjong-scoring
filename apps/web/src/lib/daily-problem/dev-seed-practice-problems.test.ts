// @vitest-environment node
import { createHash } from "node:crypto";

import {
  archiveIdentityInput,
  parsePracticeProblemArchiveRequest,
} from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { isDailyProblemEligible } from "./eligibility";

import { SEED_DAILY_PROBLEMS } from "../../../scripts/dev-seed/practice-problems";

describe("開発用シードの保存問題", () => {
  it.each(SEED_DAILY_PROBLEMS.map((seed, index) => [index, seed] as const))(
    "%i 番目の盤面は保存の検証を通り、正規化済みの形で、本日の問題に出せる（ローカルで本日の問題が出る）",
    (_, { payload }) => {
      const parsed = parsePracticeProblemArchiveRequest({
        kind: "agari-score",
        schemaVersion: 1,
        payload,
      });
      expect(parsed.isOk() && parsed.value.payload).toEqual(payload);
      expect(isDailyProblemEligible(payload)).toBe(true);
    },
  );

  it.each(SEED_DAILY_PROBLEMS.map((seed, index) => [index, seed] as const))(
    "%i 番目の content_hash は本番の保存と同じ計算（同一性の入力の SHA-256）に一致する",
    (_, { contentHash, payload }) => {
      const identity = archiveIdentityInput({
        kind: "agari-score",
        schemaVersion: 1,
        payload,
      });
      expect(createHash("sha256").update(identity, "utf8").digest("hex")).toBe(
        contentHash,
      );
    },
  );

  it("10 日前後は毎日別の問題を出せる数があり、盤面が重ならない", () => {
    expect(SEED_DAILY_PROBLEMS.length).toBeGreaterThanOrEqual(10);
    expect(
      new Set(SEED_DAILY_PROBLEMS.map((seed) => seed.contentHash)).size,
    ).toBe(SEED_DAILY_PROBLEMS.length);
  });
});
