/**
 * 受験ガード（redirectUnlessExamEligible）のテスト
 *
 * @description
 * 受験できないときは play ページと同じ言語の説明ページへ戻す。英語の play から
 * 日本語の説明ページへ落とさない（日本語の戻し先は接頭辞なしのまま変えない）。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRedirect, mockGetOptionalUser, mockGetUserRankSlugs } = vi.hoisted(
  () => ({
    // 本物の redirect は例外で処理を打ち切る。後続の判定に進まないことまで写す
    mockRedirect: vi.fn((href: string) => {
      throw new Error(`NEXT_REDIRECT:${href}`);
    }),
    mockGetOptionalUser: vi.fn(),
    mockGetUserRankSlugs: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("@/lib/auth", () => ({ getOptionalUser: mockGetOptionalUser }));
vi.mock("@/lib/db/rank-queries", () => ({
  getUserRankSlugs: mockGetUserRankSlugs,
}));

const { redirectUnlessExamEligible } = await import("../exam-guard");

describe("redirectUnlessExamEligible", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOptionalUser.mockResolvedValue({ id: "user-1" });
    mockGetUserRankSlugs.mockResolvedValue([]);
  });

  it("未ログインの日本語の play は接頭辞なしの説明ページへ戻す", async () => {
    mockGetOptionalUser.mockResolvedValue(undefined);

    await expect(
      redirectUnlessExamEligible("mangan-exam", "ja"),
    ).rejects.toThrow();
    expect(mockRedirect).toHaveBeenCalledWith("/exam/mangan");
  });

  it("未ログインの英語の play は英語の説明ページへ戻す", async () => {
    mockGetOptionalUser.mockResolvedValue(undefined);

    await expect(
      redirectUnlessExamEligible("mangan-exam", "en"),
    ).rejects.toThrow();
    expect(mockRedirect).toHaveBeenCalledWith("/en/exam/mangan");
  });

  it("資格の無い級の英語の play は英語の説明ページへ戻す", async () => {
    // 無級のユーザーが 2級（pinfu-exam）の play を開いた
    await expect(
      redirectUnlessExamEligible("pinfu-exam", "en"),
    ).rejects.toThrow();
    expect(mockRedirect).toHaveBeenCalledWith("/en/exam/pinfu");
  });

  it("次に取る級なら戻さない", async () => {
    await redirectUnlessExamEligible("mangan-exam", "en");

    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
