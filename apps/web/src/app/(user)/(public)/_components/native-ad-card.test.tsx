import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HaiKind } from "@mahjong-scoring/core";

import type { NativeAdView } from "@/lib/ads/creatives";

import { NativeAdCard } from "./native-ad-card";

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
  hand: undefined,
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

  it("手牌があれば帯に手牌を並べ、画像・絵文字は出さない", async () => {
    const { container } = render(
      await NativeAdCard({
        creative: { ...creative, hand: [HaiKind.ManZu1, HaiKind.ManZu2] },
      }),
    );
    expect(container.querySelectorAll("img")).toHaveLength(2);
    expect(container.textContent).not.toContain("📘");
    expect(container.querySelector("p")?.textContent).toBe("点数計算の定番");
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
