/**
 * 受験ガード（redirectUnlessExamEligible）のテスト
 *
 * @description
 * 受験できないときは play ページと同じ言語の説明ページへ戻す。英語の play から
 * 日本語の説明ページへ落とさない（日本語の戻し先は接頭辞なしのまま変えない）。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRedirect, mockGetAuthState, mockGetUserRankSlugs } = vi.hoisted(
  () => ({
    // 本物の redirect は例外で処理を打ち切る。後続の判定に進まないことまで写す
    mockRedirect: vi.fn((href: string) => {
      throw new Error(`NEXT_REDIRECT:${href}`);
    }),
    mockGetAuthState: vi.fn(),
    mockGetUserRankSlugs: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("@/lib/auth", () => ({ getAuthState: mockGetAuthState }));
vi.mock("@/lib/db/rank-queries", () => ({
  getUserRankSlugs: mockGetUserRankSlugs,
}));

const { redirectUnlessExamEligible } = await import("../exam-guard");
const { AuthServiceUnavailableError } =
  await import("@/lib/auth-service-failure");

describe("redirectUnlessExamEligible", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthState.mockResolvedValue({
      kind: "signedIn",
      user: { id: "user-1" },
    });
    mockGetUserRankSlugs.mockResolvedValue([]);
  });

  it("未ログインの日本語の play は接頭辞なしの説明ページへ戻す", async () => {
    mockGetAuthState.mockResolvedValue({ kind: "signedOut" });

    await expect(
      redirectUnlessExamEligible("mangan-exam", "ja"),
    ).rejects.toThrow();
    expect(mockRedirect).toHaveBeenCalledWith("/exam/mangan");
  });

  it("未ログインの英語の play は英語の説明ページへ戻す", async () => {
    mockGetAuthState.mockResolvedValue({ kind: "signedOut" });

    await expect(
      redirectUnlessExamEligible("mangan-exam", "en"),
    ).rejects.toThrow();
    expect(mockRedirect).toHaveBeenCalledWith("/en/exam/mangan");
  });

  /**
   * 認証サーバーの障害でログイン済みか分からないとき。「資格が無い」と同じ扱いで
   * 説明ページへ戻すと、受験できる人が理由も分からず戻される。
   */
  it("ログイン済みか確かめられなかったときは戻さず、投げてエラー境界に任せる", async () => {
    mockGetAuthState.mockResolvedValue({ kind: "unknown" });

    await expect(
      redirectUnlessExamEligible("mangan-exam", "ja"),
    ).rejects.toBeInstanceOf(AuthServiceUnavailableError);
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockGetUserRankSlugs).not.toHaveBeenCalled();
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
