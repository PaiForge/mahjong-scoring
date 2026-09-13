import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock("@/lib/rate-limit-ip", async () => await import("@/test/auth-mocks"));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

import { mockEnforceIpRateLimit } from "@/test/auth-mocks";

import { sendContactMail } from "../send-contact-mail";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const input = {
  name: "山田 太郎",
  email: "taro@example.com",
  subject: "点数表について",
  message: "1 行目\n<b>2 行目</b> & 記号",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("sendContactMail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockEnforceIpRateLimit.mockResolvedValue(undefined);
    mockSend.mockResolvedValue({ data: { id: "mail-id" }, error: null });
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_TO_EMAIL", "owner@example.com");
    vi.stubEnv("CONTACT_FROM_EMAIL", "contact@score.mahjong.help");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("レートリミット超過なら送らずに rateLimited を返す", async () => {
    mockEnforceIpRateLimit.mockResolvedValue({ error: "rateLimited" });

    await expect(sendContactMail(input)).resolves.toEqual({
      error: "rateLimited",
    });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("検証を通らない内容は送らずにそのキーを返す", async () => {
    await expect(
      sendContactMail({ ...input, subject: "a\nBcc: x@example.com" }),
    ).resolves.toEqual({ error: "subjectInvalid" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("送信設定が無ければ sendFailed", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    await expect(sendContactMail(input)).resolves.toEqual({
      error: "sendFailed",
    });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("運営宛てに Reply-To 付きで送り、HTML 本文はエスケープする", async () => {
    await expect(sendContactMail(input)).resolves.toEqual({ success: true });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const payload = mockSend.mock.calls[0][0];
    expect(payload).toMatchObject({
      from: "contact@score.mahjong.help",
      to: "owner@example.com",
      replyTo: "taro@example.com",
    });
    expect(payload.subject).toContain("点数表について");
    expect(payload.text).toContain("1 行目\n<b>2 行目</b> & 記号");
    expect(payload.html).toContain(
      "1 行目<br>&lt;b&gt;2 行目&lt;/b&gt; &amp; 記号",
    );
  });

  it("Resend がエラーを返したら sendFailed", async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "bad" },
    });

    await expect(sendContactMail(input)).resolves.toEqual({
      error: "sendFailed",
    });
  });

  it("送信が例外で落ちても sendFailed に畳む", async () => {
    mockSend.mockRejectedValue(new Error("network"));

    await expect(sendContactMail(input)).resolves.toEqual({
      error: "sendFailed",
    });
  });
});
