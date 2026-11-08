import { describe, expect, it, vi } from "vitest";

// 行の部品のモジュールは React Native の描画部品を読むので、Node では
// 評価に要る分だけ差し替えて、純粋な joinDescriptionLines だけを検査する
vi.mock("react-native", () => ({
  Animated: { View: () => null, Value: class {}, timing: () => ({}) },
  Pressable: () => null,
  StyleSheet: { create: <T>(styles: T) => styles },
  Text: () => null,
  View: () => null,
}));
vi.mock("../preferences/preference-anchor", () => ({
  usePreferenceAnchor: () => undefined,
}));
vi.mock("./chip", () => ({ Chip: () => null }));
vi.mock("./icons/icons", () => ({
  ChevronRightIcon: () => null,
  LockClosedIcon: () => null,
}));

const { joinDescriptionLines } = await import("./setting-toggle-row");

describe("joinDescriptionLines", () => {
  it("日本語は改行を取り除くだけで、語の間に空白を入れない", () => {
    expect(
      joinDescriptionLines(
        "場風と自風が同じ牌の雀頭を 4 符にします。\nオフのときは 2 符です。",
        "ja",
      ),
    ).toBe("場風と自風が同じ牌の雀頭を 4 符にします。オフのときは 2 符です。");
  });

  it("日本語は改行の前後の文字に触れない（移行前と同じ出力）", () => {
    expect(joinDescriptionLines("前 \n 後\n\n末", "ja")).toBe("前  後末");
  });

  it("英語は改行を空白に置き換え、前後の語がくっつかない", () => {
    expect(
      joinDescriptionLines(
        "A pair of the seat wind (a double wind)\nis scored as 4 fu.",
        "en",
      ),
    ).toBe("A pair of the seat wind (a double wind) is scored as 4 fu.");
  });

  it("英語は改行の前後に既にある空白と二重にしない", () => {
    expect(
      joinDescriptionLines("seat wind. \nWhen off,  \n  it is 2 fu.", "en"),
    ).toBe("seat wind. When off, it is 2 fu.");
  });

  it("英語は続く改行も 1 つの空白にする", () => {
    expect(joinDescriptionLines("the 13-sided wait\n\nis scored", "en")).toBe(
      "the 13-sided wait is scored",
    );
  });

  it("改行の無い説明はどちらの言語でもそのまま", () => {
    expect(joinDescriptionLines("No line breaks here.", "en")).toBe(
      "No line breaks here.",
    );
    expect(joinDescriptionLines("改行の無い説明", "ja")).toBe("改行の無い説明");
  });
});
