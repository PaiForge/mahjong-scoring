import { describe, expect, it } from "vitest";

import { resendEmailMessageKey } from "../resend-email-message";

describe("resendEmailMessageKey", () => {
  it("レート制限には待機を促すメッセージを返す", () => {
    expect(resendEmailMessageKey("rateLimited")).toBe("rateLimited");
  });

  it("送信失敗には汎用再送エラーを返す", () => {
    expect(resendEmailMessageKey("resendFailed")).toBe("resendError");
  });
});
