import { describe, expect, it } from "vitest";

import { REPORT_DETAIL_MAX_LENGTH, validateReportInput } from "./report";

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
});
