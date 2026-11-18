import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  pickByLocale,
} from "./locales";

describe("SUPPORTED_LOCALES", () => {
  it("既定ロケールは対応ロケールに含まれる（フォールバック先が作成できる）", () => {
    expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE);
  });

  it("既定ロケールは日本語", () => {
    expect(DEFAULT_LOCALE).toBe("ja");
  });

  it("同じロケールを 2 度並べない", () => {
    expect(new Set(SUPPORTED_LOCALES).size).toBe(SUPPORTED_LOCALES.length);
  });
});

describe("isSupportedLocale", () => {
  it.each(["ja", "en"])("%s は対応ロケール", (value) => {
    expect(isSupportedLocale(value)).toBe(true);
  });

  it.each(["", "fr", "JA", "ja-JP", "en-US"])(
    "%s は対応ロケールではない（言語タグの正規化はしない）",
    (value) => {
      expect(isSupportedLocale(value)).toBe(false);
    },
  );
});

describe("pickByLocale", () => {
  const ja = { locale: "ja", title: "日本語" };
  const en = { locale: "en", title: "English" };
  const fr = { locale: "fr", title: "Français" };

  it("要求したロケールの variant があればそれを選ぶ", () => {
    expect(pickByLocale([ja, en], "en")).toBe(en);
    expect(pickByLocale([en, ja], "ja")).toBe(ja);
  });

  it("要求したロケールが無ければ既定ロケール（日本語）を選ぶ", () => {
    expect(pickByLocale([fr, en, ja], "de")).toBe(ja);
  });

  it("既定ロケールも無ければ先頭を選ぶ", () => {
    expect(pickByLocale([fr, en], "de")).toBe(fr);
  });
});
