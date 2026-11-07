/**
 * パスワードリセットメール送信 Server Action のテスト
 *
 * @description
 * - `redirectTo` に送信元のページの言語（`currentLocale()`）を `locale` として付ける
 * - 送信の失敗は成功に畳む（アカウントの列挙を防ぐ）
 * - レート制限にかかったら送らずに制限の結果を返す
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnforceIpRateLimit, mockResetPasswordForEmail, mockCurrentLocale } =
  vi.hoisted(() => ({
    mockEnforceIpRateLimit: vi.fn(),
    mockResetPasswordForEmail: vi.fn(),
    mockCurrentLocale: vi.fn(),
  }));

vi.mock("@/config", () => ({ SITE_URL: "https://example.test" }));
vi.mock("@/lib/rate-limit-ip", () => ({
  enforceIpRateLimit: mockEnforceIpRateLimit,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { resetPasswordForEmail: mockResetPasswordForEmail },
  }),
}));
vi.mock("@/i18n/current-locale", () => ({
  currentLocale: mockCurrentLocale,
}));

import { forgotPassword } from "../forgot-password";

beforeEach(() => {
  vi.clearAllMocks();
  mockEnforceIpRateLimit.mockResolvedValue(undefined);
  mockResetPasswordForEmail.mockResolvedValue({ error: null });
  mockCurrentLocale.mockResolvedValue("ja");
});

describe("forgotPassword", () => {
  it.each([
    ["ja", "https://example.test/auth/callback?type=recovery&locale=ja"],
    ["en", "https://example.test/auth/callback?type=recovery&locale=en"],
  ])(
    "送信元の言語が %s なら redirectTo に locale を付ける",
    async (locale, redirectTo) => {
      mockCurrentLocale.mockResolvedValue(locale);

      const result = await forgotPassword("a@example.test");

      expect(result).toEqual({ success: true });
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith("a@example.test", {
        redirectTo,
      });
    },
  );

  it("送信に失敗しても成功を返す", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: "x" } });

    expect(await forgotPassword("a@example.test")).toEqual({ success: true });
  });

  it("レート制限にかかったら送らない", async () => {
    mockEnforceIpRateLimit.mockResolvedValue({ error: "rateLimited" });

    expect(await forgotPassword("a@example.test")).toEqual({
      error: "rateLimited",
    });
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });
});
