import { describe, expect, it } from "vitest";

import { resolveAppLocale } from "./resolve-app-locale";

describe("resolveAppLocale", () => {
  it("英語の端末は en", () => {
    expect(resolveAppLocale(["en-US"])).toBe("en");
  });

  it("日本語の端末は ja", () => {
    expect(resolveAppLocale(["ja-JP"])).toBe("ja");
  });

  it("対応していない言語を飛ばし、優先順で最初の対応言語を選ぶ", () => {
    expect(resolveAppLocale(["fr-FR", "ja"])).toBe("ja");
    expect(resolveAppLocale(["fr-FR", "en-GB", "ja-JP"])).toBe("en");
  });

  it("対応言語が 1 つも無ければ en", () => {
    expect(resolveAppLocale(["fr-FR"])).toBe("en");
  });

  it("言語の並びが空なら en", () => {
    expect(resolveAppLocale([])).toBe("en");
  });

  it("大文字小文字を区別しない", () => {
    expect(resolveAppLocale(["JA-jp"])).toBe("ja");
    expect(resolveAppLocale(["EN"])).toBe("en");
  });

  it("地域が日本なだけの別の言語を日本語と見なさない", () => {
    expect(resolveAppLocale(["zh-Hant-JP"])).toBe("en");
  });

  it("ja で始まる別の言語コードを日本語と見なさない", () => {
    expect(resolveAppLocale(["jam-JM"])).toBe("en");
  });
});
