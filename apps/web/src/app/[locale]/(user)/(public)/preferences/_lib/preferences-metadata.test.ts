import { describe, expect, it, vi } from "vitest";

// 文言はここでは見ない（robots だけを確かめる）。タイトルはキーのまま返す
vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));

import { createPreferencesMetadata } from "./preferences-metadata";

describe("createPreferencesMetadata", () => {
  it("日本語は robots を出さない（従来の出力のまま）", async () => {
    const metadata = await createPreferencesMetadata(
      "settings",
      "/preferences",
      "ja",
    );
    expect(metadata.robots).toBeUndefined();
  });

  it("英語は公開状態の表から noindex にする", async () => {
    const metadata = await createPreferencesMetadata(
      "settings.yakuOrder",
      "/preferences/yaku-order",
      "en",
    );
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
