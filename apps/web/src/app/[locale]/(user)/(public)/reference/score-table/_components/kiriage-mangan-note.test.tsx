import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { getPublication } from "@/i18n/route-policy";
import { PREFERENCES_PATH } from "@mahjong-scoring/features/routes";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/link", async () => await import("@/test/next-link-mock"));

import { KiriageManganNote } from "./kiriage-mangan-note";

describe("KiriageManganNote", () => {
  it("日本語のページでは設定ページへ今までどおりのリンクを張る", () => {
    render(<KiriageManganNote enabled={false} pageLocale="ja" />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toMatch(/^\/preferences#/);
    expect(link.getAttribute("hrefLang")).toBeNull();
    expect(screen.queryByText("language.japaneseOnly")).toBeNull();
  });

  it("英語のページでは /en を付けずに日本語の設定ページへ向け、日本語のみと示す", () => {
    render(<KiriageManganNote enabled pageLocale="en" />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toMatch(/^\/preferences#/);
    expect(link.getAttribute("hrefLang")).toBe("ja");
    expect(screen.getByText("language.japaneseOnly")).toBeDefined();
  });

  it("前提: 設定ページは英語で公開していない（公開したら英語のリンクに切り替える）", () => {
    expect(getPublication(PREFERENCES_PATH, "en")).toBe("unpublished");
  });
});
