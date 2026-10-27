import { describe, expect, it } from "vitest";
import { AuthRetryableFetchError } from "@supabase/supabase-js";

import { isAuthServiceFailure } from "./auth-service-failure";

describe("isAuthServiceFailure", () => {
  it.each([
    ["届かない", new AuthRetryableFetchError("fetch failed", 0)],
    ["status 0", { name: "AuthApiError", status: 0 }],
    ["回数制限", { name: "AuthApiError", status: 429 }],
    ["障害", { name: "AuthApiError", status: 502 }],
    ["status を持たない", { name: "AuthUnknownError" }],
  ])("%s は答えられなかった失敗", (_, error) => {
    expect(isAuthServiceFailure(error)).toBe(true);
  });

  it.each([
    ["不正な JWT", { name: "AuthApiError", status: 403, code: "bad_jwt" }],
    ["ログアウト済み", { name: "AuthSessionMissingError", status: 400 }],
    ["削除済み", { name: "AuthApiError", status: 401 }],
  ])("%s は無効という答え", (_, error) => {
    expect(isAuthServiceFailure(error)).toBe(false);
  });
});
