import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { NativeAdView } from "@/lib/ads/creatives";

import { NativeAdCard } from "./native-ad-card";
import { NativeAdRow } from "./native-ad-row";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

const creative: NativeAdView = {
  id: "c1",
  kind: "native_card",
  href: "https://www.amazon.co.jp/dp/xxx?tag=example-22",
  icon: "📘",
  imageUrl: undefined,
  imageAlt: "",
  title: "麻雀の本",
  description: "点数計算の定番",
};

describe("NativeAdCard", () => {
  it("カード全体を広告として外部リンクにする", async () => {
    render(await NativeAdCard({ creative }));
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe(creative.href);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("sponsored noopener noreferrer");
  });

  it("広告であることを表記する", async () => {
    render(await NativeAdCard({ creative }));
    const badge = screen.getByTitle("badgeLabel");
    expect(badge.querySelector("[aria-hidden='true']")?.textContent).toBe(
      "badge",
    );
    expect(badge.querySelector(".sr-only")?.textContent).toBe("badgeLabel");
  });

  it("画像が無ければ絵文字を、説明が無ければ説明を出さない", async () => {
    const { container } = render(
      await NativeAdCard({ creative: { ...creative, description: undefined } }),
    );
    expect(container.textContent).toContain("📘");
    expect(container.querySelector("p")).toBeNull();
  });

  it("画像があれば代替テキスト付きで画像を出す", async () => {
    render(
      await NativeAdCard({
        creative: {
          ...creative,
          imageUrl: "https://example.supabase.co/x.webp",
          imageAlt: "書影",
        },
      }),
    );
    expect(screen.getByAltText("書影")).toBeDefined();
  });
});

describe("NativeAdRow", () => {
  it("行リンクの一覧にそのまま入る li として描く", async () => {
    const { container } = render(
      <ul>
        {await NativeAdRow({ creative: { ...creative, kind: "native_row" } })}
      </ul>,
    );
    expect(container.querySelector("ul > li > a")?.getAttribute("rel")).toBe(
      "sponsored noopener noreferrer",
    );
    expect(screen.getByTitle("badgeLabel")).toBeDefined();
  });
});
