import { AuthRetryableFetchError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockEnforceIpRateLimit } from "@/test/auth-mocks";

const { mockSignInWithPassword } = vi.hoisted(() => ({
  mockSignInWithPassword: vi.fn(),
}));

vi.mock("@/lib/rate-limit-ip", async () => await import("@/test/auth-mocks"));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signInWithPassword: mockSignInWithPassword },
  }),
}));
vi.mock(
  "@/lib/activity-log",
  async () => await import("@/test/activity-log-mock"),
);

import { logActivityEvent } from "@/lib/activity-log";

import { signIn } from "./sign-in";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mockEnforceIpRateLimit.mockResolvedValue(undefined);
});

describe("signIn", () => {
  it("成功したらログインの活動記録を付ける", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    expect(await signIn("a@example.com", "pw")).toEqual({ success: true });
    expect(logActivityEvent).toHaveBeenCalledWith({
      userId: "user-1",
      action: "login",
    });
  });

  // アカウント列挙を防ぐ: 認証サーバーが断った理由（誤ったパスワード・存在しない
  // アカウント・未確認のメール）を区別して返さない
  it.each([
    ["資格情報の誤り", { status: 400, code: "invalid_credentials" }],
    ["メール未確認", { status: 400, code: "email_not_confirmed" }],
  ])("%s は理由を分けず invalidCredentials", async (_, error) => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: null }, error });

    expect(await signIn("a@example.com", "pw")).toEqual({
      error: "invalidCredentials",
    });
  });

  // 資格情報が正しいかどうかの答えではない。「パスワードが違う」と出すと、
  // 障害の間、正しいパスワードの人がパスワードの再設定へ向かう
  it.each([
    ["届かない", new AuthRetryableFetchError("fetch failed", 0)],
    ["障害（5xx）", { status: 503 }],
    ["回数制限（429）", { status: 429 }],
  ])(
    "認証サーバーが答えられなかった（%s）ときは serviceUnavailable",
    async (_, error) => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error,
      });

      expect(await signIn("a@example.com", "pw")).toEqual({
        error: "serviceUnavailable",
      });
      expect(logActivityEvent).not.toHaveBeenCalled();
    },
  );

  it("IP の枠を超えていたら認証サーバーへ行かない", async () => {
    mockEnforceIpRateLimit.mockResolvedValue({ error: "rateLimited" });

    expect(await signIn("a@example.com", "pw")).toEqual({
      error: "rateLimited",
    });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });
});
