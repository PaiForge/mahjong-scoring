import { beforeEach, describe, expect, it, vi } from "vitest";

import { rankRequiringMenu } from "@mahjong-scoring/features/ranks/registry";

const { mockClientIp } = vi.hoisted(() => ({ mockClientIp: vi.fn() }));

vi.mock("../client-ip", () => ({ getClientIp: mockClientIp }));

import { _resetStore } from "../rate-limit-ip";
import { handleReadExamGoals } from "./exam-goals";

beforeEach(() => {
  _resetStore();
  mockClientIp.mockResolvedValue("203.0.113.1");
});

describe("handleReadExamGoals", () => {
  it("終了の判定と同じ合格ラインを返す", async () => {
    const response = await handleReadExamGoals();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.goals.fu_score_exam).toBe(
      rankRequiringMenu("fu_score_exam")?.requirement.minScore,
    );
  });

  it("同じ IP からの回数の上限を超えたら 429", async () => {
    for (let i = 0; i < 120; i += 1) await handleReadExamGoals();

    const response = await handleReadExamGoals();

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rateLimited" });
  });
});
