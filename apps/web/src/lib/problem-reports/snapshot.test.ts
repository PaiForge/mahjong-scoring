// @vitest-environment node
import {
  DEFAULT_RULE_SETTINGS,
  parsePracticeProblemArchiveRequest,
  type PracticeProblemArchiveRequest,
} from "@mahjong-scoring/core";
import { afterEach, describe, expect, it, vi } from "vitest";

const { rebuildAgariOverride } = vi.hoisted(() => ({
  rebuildAgariOverride: { error: undefined as string | undefined },
}));

// 組み立てに失敗する経路だけ差し替える（成り立つ盤面でルールに依って失敗する例を
// 固定の盤面で作るのは、採点の変更に脆い）
vi.mock("@mahjong-scoring/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mahjong-scoring/core")>();
  return {
    ...actual,
    rebuildAgariQuestion: (
      ...args: Parameters<typeof actual.rebuildAgariQuestion>
    ) =>
      rebuildAgariOverride.error
        ? { isErr: () => true, error: rebuildAgariOverride.error }
        : actual.rebuildAgariQuestion(...args),
  };
});

import {
  meldedAgariRequest,
  riichiTenpaiRequest,
} from "../practice-problems/test-requests";

import { buildProblemReportSnapshot } from "./snapshot";

/** 検証を通した盤面 */
function parsedRequest(body: unknown): PracticeProblemArchiveRequest {
  const parsed = parsePracticeProblemArchiveRequest(body);
  if (parsed.isErr()) throw new Error(parsed.error);
  return parsed.value;
}

afterEach(() => {
  rebuildAgariOverride.error = undefined;
  vi.unstubAllEnvs();
});

describe("buildProblemReportSnapshot", () => {
  it("和了形は報告者のルール設定で正解を組み立て直し、点数・符・翻・役を写す（構造解釈の詳細は載せない）", () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "deadbeef");
    const ruleSettings = { ...DEFAULT_RULE_SETTINGS, kiriageMangan: true };

    const snapshot = buildProblemReportSnapshot(
      parsedRequest(meldedAgariRequest()),
      ruleSettings,
    );

    expect(snapshot.ruleSettings).toEqual(ruleSettings);
    expect(snapshot.revision).toBe("deadbeef");
    expect(snapshot.answer).toMatchObject({
      kind: "agari-score",
      score: {
        han: expect.any(Number),
        fu: expect.any(Number),
        scoreLevel: expect.any(String),
        payment: expect.any(Object),
        yakumanMultiplier: 0,
      },
    });
    if (!("kind" in snapshot.answer)) throw new Error("rebuild failed");
    if (snapshot.answer.kind !== "agari-score") throw new Error("kind");
    expect(snapshot.answer.score.yaku.length).toBeGreaterThan(0);
    expect(snapshot.answer.score).not.toHaveProperty("detail");
    expect(JSON.stringify(snapshot)).not.toContain("detail");
  });

  it("聴牌形は待ちごとのツモ・ロンの正解を写す", () => {
    const snapshot = buildProblemReportSnapshot(
      parsedRequest(riichiTenpaiRequest()),
      DEFAULT_RULE_SETTINGS,
    );

    if (!("kind" in snapshot.answer)) throw new Error("rebuild failed");
    if (snapshot.answer.kind !== "tenpai-score") throw new Error("kind");
    expect(snapshot.answer.waits.map((wait) => wait.agariHai)).toEqual([
      10, 13, 16,
    ]);
    for (const wait of snapshot.answer.waits) {
      expect(wait.tsumo.han).toBeGreaterThan(0);
      expect(wait.ron?.han).toBeGreaterThan(0);
    }
  });

  it("デプロイの版が無ければ null", () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "");

    expect(
      buildProblemReportSnapshot(
        parsedRequest(meldedAgariRequest()),
        DEFAULT_RULE_SETTINGS,
      ).revision,
    ).toBeNull();
  });

  it("そのルールで組み立てられない盤面は、正解の代わりに理由を残す", () => {
    rebuildAgariOverride.error = "fuOutOfOptions";

    expect(
      buildProblemReportSnapshot(
        parsedRequest(meldedAgariRequest()),
        DEFAULT_RULE_SETTINGS,
      ).answer,
    ).toEqual({ rebuildError: "fuOutOfOptions" });
  });
});
