import { messages } from "@mahjong-scoring/messages/ja";
import { describe, expect, it } from "vitest";

import {
  PROBLEM_REPORT_DETAIL_MAX_LENGTH,
  PROBLEM_REPORT_INPUT_ERRORS,
  PROBLEM_REPORT_REASONS,
  type ProblemReportReason,
  type ProblemReportStage,
  isProblemReportReasonAllowed,
  problemReportReasonsFor,
  validateProblemReportInput,
} from "./problem-report";

describe("problemReportReasonsFor", () => {
  it.each([
    ["agari-score", "answering", ["invalid_board", "other"]],
    ["tenpai-score", "answering", ["invalid_board", "other"]],
    [
      "tenpai-score",
      "machiRevealed",
      ["wrong_machi", "invalid_board", "other"],
    ],
    ["agari-score", "machiRevealed", ["invalid_board", "other"]],
    [
      "agari-score",
      "revealed",
      ["wrong_score", "wrong_yaku", "wrong_fu", "invalid_board", "other"],
    ],
    [
      "tenpai-score",
      "revealed",
      [
        "wrong_score",
        "wrong_yaku",
        "wrong_fu",
        "wrong_machi",
        "invalid_board",
        "other",
      ],
    ],
  ] as const)(
    "%s の %s では決まった理由だけを選択肢の並びで返す",
    (kind, stage, expected) => {
      expect(problemReportReasonsFor(kind, stage)).toEqual(expected);
    },
  );

  it("正解を見る前は点数・役・符・待ちの誤りを選べない", () => {
    for (const kind of ["agari-score", "tenpai-score"] as const) {
      const reasons = problemReportReasonsFor(kind, "answering");
      for (const reason of [
        "wrong_score",
        "wrong_yaku",
        "wrong_fu",
        "wrong_machi",
      ] as const) {
        expect(reasons, `${kind} ${reason}`).not.toContain(reason);
      }
    }
  });

  it("待ち牌の誤りは聴牌形だけで選べる", () => {
    const stages: readonly ProblemReportStage[] = [
      "answering",
      "machiRevealed",
      "revealed",
    ];
    for (const stage of stages) {
      expect(problemReportReasonsFor("agari-score", stage)).not.toContain(
        "wrong_machi",
      );
    }
  });
});

describe("isProblemReportReasonAllowed", () => {
  it("段階で選べる理由だけを通す", () => {
    expect(
      isProblemReportReasonAllowed("agari-score", "revealed", "wrong_score"),
    ).toBe(true);
    expect(
      isProblemReportReasonAllowed("agari-score", "answering", "wrong_score"),
    ).toBe(false);
    expect(
      isProblemReportReasonAllowed(
        "tenpai-score",
        "machiRevealed",
        "wrong_machi",
      ),
    ).toBe(true);
    expect(
      isProblemReportReasonAllowed(
        "tenpai-score",
        "machiRevealed",
        "wrong_score",
      ),
    ).toBe(false);
    expect(
      isProblemReportReasonAllowed("agari-score", "revealed", "wrong_machi"),
    ).toBe(false);
  });

  it("盤面の誤りとその他はどの段階でも選べる", () => {
    const always: readonly ProblemReportReason[] = ["invalid_board", "other"];
    for (const kind of ["agari-score", "tenpai-score"] as const) {
      for (const stage of ["answering", "machiRevealed", "revealed"] as const) {
        for (const reason of always) {
          expect(
            isProblemReportReasonAllowed(kind, stage, reason),
            `${kind} ${stage} ${reason}`,
          ).toBe(true);
        }
      }
    }
  });
});

describe("validateProblemReportInput", () => {
  it("理由と詳細を整えて返す（空の詳細は null）", () => {
    expect(validateProblemReportInput("wrong_score", "  ")).toEqual({
      ok: true,
      value: { reason: "wrong_score", detail: null },
    });
    expect(validateProblemReportInput("wrong_yaku", " 一盃口が無い ")).toEqual({
      ok: true,
      value: { reason: "wrong_yaku", detail: "一盃口が無い" },
    });
  });

  it("知らない理由を弾く", () => {
    expect(validateProblemReportInput("spam", "")).toEqual({
      ok: false,
      error: "invalidReason",
    });
    expect(validateProblemReportInput(undefined, "")).toEqual({
      ok: false,
      error: "invalidReason",
    });
  });

  it("その他は詳細が要る", () => {
    expect(validateProblemReportInput("other", " ")).toEqual({
      ok: false,
      error: "detailRequired",
    });
  });

  it("詳細の長さに上限がある", () => {
    expect(
      validateProblemReportInput(
        "wrong_fu",
        "あ".repeat(PROBLEM_REPORT_DETAIL_MAX_LENGTH + 1),
      ),
    ).toEqual({ ok: false, error: "detailTooLong" });
  });

  it("上限を超えた詳細はその他でも長さの誤りとして返す", () => {
    expect(
      validateProblemReportInput(
        "other",
        "あ".repeat(PROBLEM_REPORT_DETAIL_MAX_LENGTH + 1),
      ),
    ).toEqual({ ok: false, error: "detailTooLong" });
  });

  it("上限ちょうどの詳細は通る（前後の空白は数えない）", () => {
    const detail = "あ".repeat(PROBLEM_REPORT_DETAIL_MAX_LENGTH);
    expect(validateProblemReportInput("wrong_fu", ` ${detail} `)).toEqual({
      ok: true,
      value: { reason: "wrong_fu", detail },
    });
  });

  it("その他は詳細を書けば通る", () => {
    expect(validateProblemReportInput("other", "ドラ表示牌が 5 枚目")).toEqual({
      ok: true,
      value: { reason: "other", detail: "ドラ表示牌が 5 枚目" },
    });
  });

  it("文字列でない詳細は書かなかったものとして扱う", () => {
    expect(validateProblemReportInput("invalid_board", undefined)).toEqual({
      ok: true,
      value: { reason: "invalid_board", detail: null },
    });
    expect(validateProblemReportInput("other", 1)).toEqual({
      ok: false,
      error: "detailRequired",
    });
  });
});

describe("PROBLEM_REPORT_REASONS", () => {
  it.each(PROBLEM_REPORT_REASONS)(
    "%s は報告の理由として通り、辞書に選択肢の文言がある",
    (reason) => {
      expect(validateProblemReportInput(reason, "詳細").ok).toBe(true);
      // 例: problemReport.reasons.wrong_score
      expect(Object.keys(messages.problemReport.reasons)).toContain(reason);
    },
  );
});

describe("PROBLEM_REPORT_INPUT_ERRORS", () => {
  it.each(PROBLEM_REPORT_INPUT_ERRORS)("%s は辞書に文言がある", (error) => {
    // 例: problemReport.errors.detailTooLong
    expect(Object.keys(messages.problemReport.errors)).toContain(error);
  });
});
