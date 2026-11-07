import { beforeEach, describe, expect, it, vi } from "vitest";

const { notFound, setRequestLocale } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  setRequestLocale: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound }));
vi.mock("next-intl/server", () => ({ setRequestLocale }));

import { prepareRouteLocale } from "./route-locale";

beforeEach(() => {
  notFound.mockClear();
  setRequestLocale.mockClear();
});

describe("prepareRouteLocale", () => {
  it.each([
    ["ja", "/practice"],
    ["ja", "/practice/jantou-fu/play"],
    ["ja", "/u/alice"],
    ["en", "/reference/score-table"],
    ["en", "/"],
    ["en", "/lessons"],
    ["en", "/lessons/jantou-fu"],
    ["en", "/reference/yaku"],
    ["en", "/reference/glossary/jantou"],
  ] as const)(
    "%s の公開ページ %s はロケールを確定して返す",
    async (locale, path) => {
      await expect(
        prepareRouteLocale(Promise.resolve({ locale }), path),
      ).resolves.toBe(locale);
      expect(setRequestLocale).toHaveBeenCalledWith(locale);
      expect(notFound).not.toHaveBeenCalled();
    },
  );

  it.each([["fr"], ["EN"], ["ja-JP"], [""]])(
    "対応外のロケール %s は 404（setRequestLocale を呼ばない）",
    async (locale) => {
      await expect(
        prepareRouteLocale(Promise.resolve({ locale }), "/"),
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(setRequestLocale).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["en", "/practice"],
    ["en", "/dashboard"],
    ["en", "/getting-started"],
    ["en", "/lessons/about-this-app"],
    ["en", "/reference/demo"],
    ["ja", "/nonexistent"],
  ] as const)(
    "%s で未公開のパス %s は 404（日本語の本文で代用しない）",
    async (locale, path) => {
      await expect(
        prepareRouteLocale(Promise.resolve({ locale }), path),
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(setRequestLocale).not.toHaveBeenCalled();
    },
  );
});
