import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { linkLabel } from "./link-label";

describe("linkLabel", () => {
  it("言語をまたがないリンクは文言をそのまま返す（日本語の出力の形を変えない）", () => {
    expect(
      linkLabel("練習を選ぶ", { href: "/practice", crossLocale: false }, "x"),
    ).toBe("練習を選ぶ");
  });

  it("言語をまたぐリンクは文言に「日本語のみ」の印を添える", () => {
    const { container } = render(
      <span>
        {linkLabel(
          "View all",
          { href: "/announcements", crossLocale: true },
          "Japanese only",
        )}
      </span>,
    );

    expect(container.textContent).toBe("View allJapanese only");
  });
});
