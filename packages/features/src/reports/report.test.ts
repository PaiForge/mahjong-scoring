import { messages } from "@mahjong-scoring/messages/ja";
import { describe, expect, it } from "vitest";

import {
  REPORT_DETAIL_MAX_LENGTH,
  REPORT_INPUT_ERRORS,
  REPORT_REASONS,
  isReportReason,
  validateReportInput,
} from "./report";

describe("validateReportInput", () => {
  it("理由と詳細を整えて返す（空の詳細は null）", () => {
    expect(validateReportInput("spam", "  ")).toEqual({
      ok: true,
      value: { reason: "spam", detail: null },
    });
    expect(validateReportInput("harassment", " 暴言 ")).toEqual({
      ok: true,
      value: { reason: "harassment", detail: "暴言" },
    });
  });

  it("知らない理由を弾く", () => {
    expect(validateReportInput("nope", "")).toEqual({
      ok: false,
      error: "invalidReason",
    });
  });

  it("その他は詳細が要る", () => {
    expect(validateReportInput("other", " ")).toEqual({
      ok: false,
      error: "detailRequired",
    });
  });

  it("詳細の長さに上限がある", () => {
    expect(
      validateReportInput("spam", "あ".repeat(REPORT_DETAIL_MAX_LENGTH + 1)),
    ).toEqual({ ok: false, error: "detailTooLong" });
  });

  it("上限ちょうどの詳細は通る（前後の空白は数えない）", () => {
    const detail = "あ".repeat(REPORT_DETAIL_MAX_LENGTH);
    expect(validateReportInput("spam", ` ${detail} `)).toEqual({
      ok: true,
      value: { reason: "spam", detail },
    });
  });

  it("その他は詳細を書けば通る", () => {
    expect(validateReportInput("other", "成りすまし以外の迷惑行為")).toEqual({
      ok: true,
      value: { reason: "other", detail: "成りすまし以外の迷惑行為" },
    });
  });

  it("文字列でない詳細は書かなかったものとして扱う", () => {
    expect(validateReportInput("cheating", undefined)).toEqual({
      ok: true,
      value: { reason: "cheating", detail: null },
    });
    expect(validateReportInput("other", 1)).toEqual({
      ok: false,
      error: "detailRequired",
    });
  });
});

describe("REPORT_REASONS", () => {
  it.each(REPORT_REASONS)(
    "%s は通報の理由として通り、辞書に選択肢の文言がある",
    (reason) => {
      expect(isReportReason(reason)).toBe(true);
      // 例: report.reasons.spam
      expect(Object.keys(messages.report.reasons)).toContain(reason);
    },
  );

  it("同じ理由を 2 度並べない", () => {
    expect(new Set(REPORT_REASONS).size).toBe(REPORT_REASONS.length);
  });
});

describe("REPORT_INPUT_ERRORS", () => {
  it.each(REPORT_INPUT_ERRORS)("%s の文言が辞書にある", (error) => {
    // 例: report.errors.detailRequired
    expect(Object.keys(messages.report.errors)).toContain(error);
  });
});

describe("isReportReason", () => {
  it("文字列でない値は理由ではない", () => {
    expect(isReportReason(undefined)).toBe(false);
    expect(isReportReason(1)).toBe(false);
  });
});
