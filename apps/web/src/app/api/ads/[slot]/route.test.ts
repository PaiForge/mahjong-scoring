// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import type { NativeAdView } from "@mahjong-scoring/features/ads/native-ad";
import { parseNativeAdsResponse } from "@mahjong-scoring/features/ads/parse-native-ads-response";

const ad: NativeAdView = {
  id: "a",
  kind: "native_card",
  href: "https://www.amazon.co.jp/dp/B08721VWS5?tag=example-22",
  icon: undefined,
  imageUrl: undefined,
  imageAlt: "",
  hand: [0, 1, 2],
  title: "本",
  description: undefined,
};

const getNativeAdPlacements = vi.fn(async (_slot: string) => [ad]);

vi.mock("@/lib/ads/creatives", () => ({
  getNativeAdPlacements: (slot: string) => getNativeAdPlacements(slot),
}));

import { generateStaticParams, GET } from "./route";

function call(slot: string) {
  return GET(new Request(`http://localhost/api/ads/${slot}`), {
    params: Promise.resolve({ slot }),
  });
}

describe("GET /api/ads/[slot]", () => {
  it("モバイルのスロットだけを静的に生成する", () => {
    expect(generateStaticParams()).toEqual([
      { slot: "mobile-practice-grid-native-ad" },
    ]);
  });

  it("モバイルのスロットの広告を、モバイルが読める形で返す", async () => {
    const response = await call("mobile-practice-grid-native-ad");

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(getNativeAdPlacements).toHaveBeenCalledWith(
      "mobile-practice-grid-native-ad",
    );
    expect(parseNativeAdsResponse(await response.json())).toEqual({
      ads: [ad],
    });
  });

  it.each(["practice-grid-native-ad", "unknown"])(
    "モバイルのものでないスロット（%s）は 404",
    async (slot) => {
      const response = await call(slot);
      expect(response.status).toBe(404);
    },
  );
});
