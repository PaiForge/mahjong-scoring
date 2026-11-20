import { describe, expect, it } from "vitest";
import { AuthRetryableFetchError } from "@supabase/supabase-js";

import {
  isAuthEmailRateLimited,
  isAuthServiceFailure,
} from "./auth-service-failure";

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

describe("isAuthEmailRateLimited", () => {
  it.each([
    ["status 429", { status: 429 }],
    ["コード", { status: 400, code: "over_email_send_rate_limit" }],
  ])("%s は送信回数制限", (_, error) => {
    expect(isAuthEmailRateLimited(error)).toBe(true);
  });

  it.each([
    ["別のコード", { status: 422, code: "email_exists" }],
    ["障害", { status: 500 }],
    ["status もコードも無い", {}],
  ])("%s は送信回数制限ではない", (_, error) => {
    expect(isAuthEmailRateLimited(error)).toBe(false);
  });
});
