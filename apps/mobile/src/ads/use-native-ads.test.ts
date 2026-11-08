import { beforeEach, describe, expect, it, vi } from "vitest";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import { readPublicMobileApi } from "../auth/read-public-mobile-api";
import { useAppLocale } from "../lib/use-app-locale";
import { useNativeAds } from "./use-native-ads";

vi.mock("../auth/read-public-mobile-api", () => ({
  readPublicMobileApi: vi.fn(),
}));
vi.mock("../lib/use-app-locale", () => ({ useAppLocale: vi.fn() }));
vi.mock("react", () => ({
  useState: () => [[{ title: "日本語の広告" }], vi.fn()],
  useEffect: (effect: () => unknown) => effect(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readPublicMobileApi).mockResolvedValue(undefined);
});

describe("広告の言語", () => {
  it("英語では取得せず、保持している日本語の広告も返さない", () => {
    vi.mocked(useAppLocale).mockReturnValue("en");
    expect(useNativeAds(MOBILE_AD_SLOTS.practiceGrid)).toEqual([]);
    expect(readPublicMobileApi).not.toHaveBeenCalled();
  });
  it("日本語では従来どおり取得して表示する", () => {
    vi.mocked(useAppLocale).mockReturnValue("ja");
    expect(useNativeAds(MOBILE_AD_SLOTS.practiceGrid)).toEqual([
      { title: "日本語の広告" },
    ]);
    expect(readPublicMobileApi).toHaveBeenCalledOnce();
  });
});
