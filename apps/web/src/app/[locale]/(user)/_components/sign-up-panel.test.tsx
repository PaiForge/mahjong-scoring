import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));

const { SignUpPanel } = await import("./sign-up-panel");

const TEXTS = { title: "title", description: "description", cta: "cta" };

afterEach(() => {
  cleanup();
});

describe("SignUpPanel", () => {
  it("張る先を渡さなければ /sign-up へ印なしで張る（日本語のページの従来の形）", () => {
    render(<SignUpPanel {...TEXTS} />);

    const link = screen.getByRole("link", { name: "cta" });
    expect(link.getAttribute("href")).toBe("/sign-up");
    expect(link.getAttribute("hrefLang")).toBeNull();
    expect(screen.queryByText("language.japaneseOnly")).toBeNull();
  });

  it("登録ページが今の言語で未公開なら、素の <a hrefLang=ja> と「日本語のみ」の印で日本語の登録へ送る", () => {
    render(
      <SignUpPanel
        {...TEXTS}
        navTarget={{ href: "/sign-up", crossLocale: true }}
      />,
    );

    const link = screen.getByRole("link", { name: /cta/ });
    expect(link.getAttribute("href")).toBe("/sign-up");
    expect(link.getAttribute("hrefLang")).toBe("ja");
    expect(link.textContent).toContain("language.japaneseOnly");
  });

  it("同じ言語で公開している張る先なら印を付けない", () => {
    render(
      <SignUpPanel
        {...TEXTS}
        navTarget={{ href: "/en/sign-up", crossLocale: false }}
      />,
    );

    const link = screen.getByRole("link", { name: "cta" });
    expect(link.getAttribute("href")).toBe("/en/sign-up");
    expect(link.getAttribute("hrefLang")).toBeNull();
  });

  it("逃げ道のリンクは navTarget で受けるとその言語の href を張る", () => {
    render(
      <SignUpPanel
        {...TEXTS}
        navTarget={{ href: "/sign-up", crossLocale: true }}
        secondary={{
          label: "browse",
          navTarget: { href: "/en/practice", crossLocale: false },
        }}
      />,
    );

    const link = screen.getByRole("link", { name: "browse" });
    expect(link.getAttribute("href")).toBe("/en/practice");
    expect(link.getAttribute("hrefLang")).toBeNull();
  });

  it("逃げ道のリンクを href で受けるとそのまま張る", () => {
    render(
      <SignUpPanel
        {...TEXTS}
        secondary={{ label: "browse", href: "/practice" }}
      />,
    );

    expect(
      screen.getByRole("link", { name: "browse" }).getAttribute("href"),
    ).toBe("/practice");
  });
});
