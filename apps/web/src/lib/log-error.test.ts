import { afterEach, describe, expect, it, vi } from "vitest";

import { logExternalError, toErrorMessage } from "./log-error";

describe("toErrorMessage", () => {
  it("Error はメッセージを返す", () => {
    expect(toErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("文字列・数値はそのまま文字列にする", () => {
    expect(toErrorMessage("boom")).toBe("boom");
    expect(toErrorMessage(42)).toBe("42");
  });

  it("SDK が返す素のエラーオブジェクトは全フィールドを残す", () => {
    expect(
      toErrorMessage({
        name: "validation_error",
        message: "bad",
        statusCode: 422,
      }),
    ).toBe('{"name":"validation_error","message":"bad","statusCode":422}');
  });

  it("JSON にできないオブジェクトは String() に落とす", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(toErrorMessage(circular)).toBe("[object Object]");
  });

  it("null / undefined も落ちない", () => {
    expect(toErrorMessage(null)).toBe("null");
    expect(toErrorMessage(undefined)).toBe("undefined");
  });
});

describe("logExternalError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("[tag] message: 形式で記録する", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logExternalError("sendContactMail", "Resend API error", {
      name: "validation_error",
      message: "bad",
    });
    expect(spy).toHaveBeenCalledWith(
      "[sendContactMail] Resend API error:",
      '{"name":"validation_error","message":"bad"}',
    );
  });
});
