import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRateLimit, mockResend, mockSignUp } = vi.hoisted(() => ({
  mockRateLimit: vi.fn(),
  mockResend: vi.fn(),
  mockSignUp: vi.fn(),
}));

vi.mock("@/lib/rate-limit-ip", () => ({ enforceIpRateLimit: mockRateLimit }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { resend: mockResend, signUp: mockSignUp },
  }),
}));

import { signUp } from "../../../_actions/sign-up";
import { resendEmail } from "../resend-email";

beforeEach(() => {
  vi.clearAllMocks();
  mockRateLimit.mockResolvedValue(null);
  mockResend.mockResolvedValue({ error: null });
  mockSignUp.mockResolvedValue({ error: null });
});

describe("resendEmail", () => {
  it("再送メールのリンクも登録時と同じ /auth/callback に着地させる", async () => {
    // 渡し忘れると GoTrue は site_url（LP）へ着地させ、ログインしないまま終わる
    await signUp("a@example.com", "password1");
    await resendEmail("a@example.com");

    const signUpRedirect =
      mockSignUp.mock.calls[0]?.[0]?.options?.emailRedirectTo;
    const resendRedirect =
      mockResend.mock.calls[0]?.[0]?.options?.emailRedirectTo;
    expect(signUpRedirect).toMatch(/\/auth\/callback$/);
    expect(resendRedirect).toBe(signUpRedirect);
  });

  it("GoTrue の送信頻度制限は rateLimited を返す", async () => {
    mockResend.mockResolvedValue({ error: { status: 429 } });
    expect(await resendEmail("a@example.com")).toEqual({
      error: "rateLimited",
    });
  });

  it("それ以外の失敗は resendFailed を返す", async () => {
    mockResend.mockResolvedValue({ error: { status: 500 } });
    expect(await resendEmail("a@example.com")).toEqual({
      error: "resendFailed",
    });
  });
});
