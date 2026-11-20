import { describe, expect, it, vi } from "vitest";

vi.mock("@/config", () => ({ SITE_URL: "https://example.test" }));

import { recoveryRedirectTo } from "./recovery-redirect";

describe("recoveryRedirectTo", () => {
  it("日本語は locale を付けない従来のリンク", () => {
    expect(recoveryRedirectTo("ja")).toBe(
      "https://example.test/auth/callback?type=recovery",
    );
  });

  it("英語は locale=en を付ける", () => {
    expect(recoveryRedirectTo("en")).toBe(
      "https://example.test/auth/callback?type=recovery&locale=en",
    );
  });
});
