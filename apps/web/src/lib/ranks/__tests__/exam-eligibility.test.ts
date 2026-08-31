import { describe, expect, it } from "vitest";

import { evaluateExamEligibility } from "../exam-eligibility";

describe("evaluateExamEligibility", () => {
  it("昇級試験でない練習は undefined（資格の概念がない）", () => {
    expect(evaluateExamEligibility("jantou_fu", [])).toBeUndefined();
    expect(evaluateExamEligibility("score_calculation", [])).toBeUndefined();
  });

  it("無級なら最下位（5級）の試験だけが eligible", () => {
    expect(evaluateExamEligibility("mangan_exam", [])?.kind).toBe("eligible");
    expect(evaluateExamEligibility("fu_exam", [])?.kind).toBe("locked");
    expect(evaluateExamEligibility("pinfu_exam", [])?.kind).toBe("locked");
  });

  it("次の級の試験は eligible、その上は locked", () => {
    const achieved = ["kyu-5"] as const;
    expect(evaluateExamEligibility("fu_exam", achieved)?.kind).toBe("eligible");
    expect(evaluateExamEligibility("chiitoitsu_exam", achieved)?.kind).toBe(
      "locked",
    );
  });

  it("達成済みの級の試験は retryable（再挑戦できる）", () => {
    const achieved = ["kyu-5", "kyu-4"] as const;
    expect(evaluateExamEligibility("mangan_exam", achieved)?.kind).toBe(
      "retryable",
    );
    expect(evaluateExamEligibility("fu_exam", achieved)?.kind).toBe(
      "retryable",
    );
    expect(evaluateExamEligibility("chiitoitsu_exam", achieved)?.kind).toBe(
      "eligible",
    );
  });

  it("locked には先に合格すべき級（次の級）が入る", () => {
    const eligibility = evaluateExamEligibility("pinfu_exam", ["kyu-5"]);
    expect(eligibility?.kind).toBe("locked");
    if (eligibility?.kind === "locked") {
      expect(eligibility.requiredRank.slug).toBe("kyu-4");
      expect(eligibility.rank.slug).toBe("kyu-2");
    }
  });

  it("飛び番で級を保持していても剥奪せず、最下位の未達成が次になる", () => {
    // 過去の仕様（独立評価）で 5級と2級だけを持つユーザー
    const achieved = ["kyu-5", "kyu-2"] as const;
    // 達成済みの2級は再挑戦できる
    expect(evaluateExamEligibility("pinfu_exam", achieved)?.kind).toBe(
      "retryable",
    );
    // 次に取るのは飛ばした4級
    expect(evaluateExamEligibility("fu_exam", achieved)?.kind).toBe("eligible");
    expect(evaluateExamEligibility("chiitoitsu_exam", achieved)?.kind).toBe(
      "locked",
    );
    expect(evaluateExamEligibility("fu_score_exam", achieved)?.kind).toBe(
      "locked",
    );
  });

  it("要件（合格点）を表示用に返す", () => {
    const eligibility = evaluateExamEligibility("mangan_exam", []);
    expect(eligibility?.requirement.minScore).toBe(10);
    expect(eligibility?.rank.slug).toBe("kyu-5");
  });
});
