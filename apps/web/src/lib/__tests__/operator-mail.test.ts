import { afterEach, describe, expect, it, vi } from "vitest";

import { readOperatorMailConfig } from "../operator-mail";

describe("readOperatorMailConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("API キー・宛先・送信元を返す", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_TO_EMAIL", "owner@example.com");
    vi.stubEnv("CONTACT_FROM_EMAIL", "contact@score.mahjong.help");

    expect(readOperatorMailConfig()).toEqual({
      apiKey: "re_test",
      to: "owner@example.com",
      from: "contact@score.mahjong.help",
    });
  });

  it("送信元が未設定なら Resend のテスト用アドレスから送る", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_TO_EMAIL", "owner@example.com");
    vi.stubEnv("CONTACT_FROM_EMAIL", "");

    expect(readOperatorMailConfig()?.from).toBe("onboarding@resend.dev");
  });

  it("API キーか宛先が欠けていれば undefined", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("CONTACT_TO_EMAIL", "owner@example.com");
    expect(readOperatorMailConfig()).toBeUndefined();

    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_TO_EMAIL", "");
    expect(readOperatorMailConfig()).toBeUndefined();
  });
});
