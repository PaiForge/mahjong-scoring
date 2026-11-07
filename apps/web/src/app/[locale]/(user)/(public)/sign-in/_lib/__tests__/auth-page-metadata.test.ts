/**
 * 認証ページの metadata のテスト
 *
 * @description
 * タイトルはページの言語で引き（`createTitleOnlyMetadata` に locale を渡す）、
 * 英語の robots は実際の公開状態の表から決まる（`published-noindex` なので noindex）。
 * 日本語も表では `published-noindex` だが、従来の出力のまま robots を持たない。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateTitleOnlyMetadata } = vi.hoisted(() => ({
  mockCreateTitleOnlyMetadata: vi.fn(),
}));

vi.mock("@/app/_lib/metadata", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/_lib/metadata")>()),
  createTitleOnlyMetadata: mockCreateTitleOnlyMetadata,
}));

import { createAuthPageMetadata } from "../auth-page-metadata";

const AUTH_PAGES = [
  ["auth", "signInPageTitle", "/sign-in"],
  ["signUp", "pageTitle", "/sign-up"],
  ["verifyEmail", "pageTitle", "/sign-up/verify-email"],
  ["forgotPassword", "pageTitle", "/forgot-password"],
  ["resetPassword", "pageTitle", "/reset-password"],
] as const;

beforeEach(() => {
  mockCreateTitleOnlyMetadata.mockReset();
  mockCreateTitleOnlyMetadata.mockResolvedValue({ title: "T" });
});

describe("createAuthPageMetadata", () => {
  it.each(AUTH_PAGES)(
    "英語の %s（%s）は noindex, follow を付ける",
    async (namespace, titleKey, path) => {
      const metadata = await createAuthPageMetadata(
        namespace,
        titleKey,
        path,
        "en",
      );

      expect(metadata).toEqual({
        title: "T",
        robots: { index: false, follow: true },
      });
      expect(mockCreateTitleOnlyMetadata).toHaveBeenCalledWith(
        namespace,
        titleKey,
        undefined,
        { locale: "en" },
      );
    },
  );

  it.each(AUTH_PAGES)(
    "日本語の %s（%s）は robots を持たない",
    async (namespace, titleKey, path) => {
      const metadata = await createAuthPageMetadata(
        namespace,
        titleKey,
        path,
        "ja",
      );

      expect(metadata).toEqual({ title: "T" });
      expect(metadata).not.toHaveProperty("robots");
    },
  );
});
