import { describe, expect, it } from "vitest";

import { rankRequiringMenu } from "@mahjong-scoring/features/ranks/registry";

import { handleReadExamGoals } from "./exam-goals";

describe("handleReadExamGoals", () => {
  it("終了の判定と同じ合格ラインを返す", async () => {
    const response = handleReadExamGoals();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.goals.fu_score_exam).toBe(
      rankRequiringMenu("fu_score_exam")?.requirement.minScore,
    );
  });
});
