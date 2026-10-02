import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { NativeAdView } from "@/lib/ads/creatives";

import { NativeAdRow } from "./native-ad-row";

vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));

const creative: NativeAdView = {
  id: "c1",
  kind: "native_row",
  href: "https://www.amazon.co.jp/dp/xxx?tag=example-22",
  icon: "📘",
  imageUrl: undefined,
  imageAlt: "",
  hand: undefined,
  title: "麻雀の本",
  description: "点数計算の定番",
};

describe("NativeAdRow", () => {
  it("行リンクの一覧にそのまま入る li として描く", async () => {
    const { container } = render(<ul>{await NativeAdRow({ creative })}</ul>);
    expect(container.querySelector("ul > li > a")?.getAttribute("rel")).toBe(
      "sponsored noopener noreferrer",
    );
    expect(screen.getByTitle("badgeLabel")).toBeDefined();
  });
});
