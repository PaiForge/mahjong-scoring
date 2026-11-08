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

  describe("UI の言語", () => {
    /** 日本語の UI から送ったときの本文（従来のメールそのもの） */
    const JA_TEXT = [
      "お名前: 山田 太郎",
      "メールアドレス: taro@example.com",
      "件名: 点数表について",
      "",
      "1 行目\n<b>2 行目</b> & 記号",
    ].join("\n");
    const JA_HTML =
      "<p><strong>お名前:</strong> 山田 太郎</p>" +
      "<p><strong>メールアドレス:</strong> taro@example.com</p>" +
      "<p><strong>件名:</strong> 点数表について</p>" +
      "<p>1 行目<br>&lt;b&gt;2 行目&lt;/b&gt; &amp; 記号</p>";

    it.each([
      ["省略", undefined],
      ["日本語", "ja"],
      ["対応していない言語", "fr"],
    ])(
      "%sなら本文に何も足さない（日本語の UI からのメールは従来のまま）",
      async (_label, uiLocale) => {
        await sendContactMail(input, uiLocale);

        const payload = mockSend.mock.calls[0][0];
        expect(payload.text).toBe(JA_TEXT);
        expect(payload.html).toBe(JA_HTML);
        expect(payload.subject).toBe("[麻雀点数計算教室] 点数表について");
      },
    );

    it("英語の UI からなら本文の先頭に「UI の言語: en」の 1 行を足し、件名・ラベルは変えない", async () => {
      await sendContactMail(input, "en");

      const payload = mockSend.mock.calls[0][0];
      expect(payload.text).toBe(`UI の言語: en\n${JA_TEXT}`);
      expect(payload.html).toBe(
        `<p><strong>UI の言語:</strong> en</p>${JA_HTML}`,
      );
      expect(payload.subject).toBe("[麻雀点数計算教室] 点数表について");
    });
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
