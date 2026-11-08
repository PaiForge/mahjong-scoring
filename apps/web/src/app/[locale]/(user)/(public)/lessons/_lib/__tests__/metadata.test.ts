import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "next-intl/server",
  async () => await import("@/app/_lib/__tests__/locale-intl-mock"),
);

// 翻訳の公開日（translatedAt）はまだどの章にも入っていないので、テストの中で
// 1 章にだけ足して「記録がある章は英語でも公開日を出す」を確かめる
const translatedAtOverride = vi.hoisted(() => ({
  value: undefined as Readonly<Partial<Record<"en", string>>> | undefined,
}));

vi.mock(
  "@mahjong-scoring/features/curriculum/registry",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@mahjong-scoring/features/curriculum/registry")
      >();
    return {
      ...original,
      getChapterBySlug: (
        slug: Parameters<typeof original.getChapterBySlug>[0],
      ) => {
        const chapter = original.getChapterBySlug(slug);
        if (chapter === undefined || translatedAtOverride.value === undefined)
          return chapter;
        return { ...chapter, translatedAt: translatedAtOverride.value };
      },
    };
  },
);

import { setupLocaleTranslations } from "@/app/_lib/__tests__/locale-intl-mock";

import { chapterNamespace } from "@mahjong-scoring/features/curriculum/chapter-namespace";
import { getChapterBySlug } from "@mahjong-scoring/features/curriculum/registry";

import { createLearnMetadata } from "../metadata";

const NAMESPACE = chapterNamespace("jantou-fu");
const PUBLISHED_AT = getChapterBySlug("jantou-fu")?.publishedAt;

beforeEach(() => {
  vi.clearAllMocks();
  translatedAtOverride.value = undefined;
});

describe("createLearnMetadata", () => {
  it("locale を省略すると日本語の canonical・article・公開日のまま", async () => {
    setupLocaleTranslations({
      ja: {
        [NAMESPACE]: { pageTitle: "雀頭の符計算", pageDescription: "説明" },
      },
    });

    const metadata = await createLearnMetadata("jantou-fu");

    expect(metadata).toMatchObject({
      title: "雀頭の符計算 - 麻雀点数計算教室",
      description: "説明",
      alternates: { canonical: "/lessons/jantou-fu" },
      openGraph: {
        type: "article",
        locale: "ja_JP",
        url: "/lessons/jantou-fu",
        publishedTime: `${PUBLISHED_AT}T00:00:00+09:00`,
        images: [{ url: "/og-image.png" }],
      },
    });
  });

  it("英語は英語の canonical と OGP にし、日本語の章の公開日を名乗らない", async () => {
    setupLocaleTranslations({
      en: { [NAMESPACE]: { pageTitle: "Pair fu", pageDescription: "About" } },
    });

    const metadata = await createLearnMetadata("jantou-fu", { locale: "en" });

    expect(metadata).toMatchObject({
      title: "Pair fu - 麻雀点数計算教室",
      alternates: { canonical: "/en/lessons/jantou-fu" },
      openGraph: {
        type: "article",
        locale: "en_US",
        url: "/en/lessons/jantou-fu",
        images: [{ url: "/og-image-en.png" }],
      },
    });
    expect(metadata.openGraph).not.toHaveProperty("publishedTime");
  });

  it("英語は翻訳の公開日（translatedAt.en）が記録された章だけ article:published_time を出す", async () => {
    setupLocaleTranslations({
      en: { [NAMESPACE]: { pageTitle: "Pair fu", pageDescription: "About" } },
    });
    translatedAtOverride.value = { en: "2026-12-01" };

    const metadata = await createLearnMetadata("jantou-fu", { locale: "en" });

    expect(metadata.openGraph).toMatchObject({
      publishedTime: "2026-12-01T00:00:00+09:00",
    });
  });

  it("翻訳の公開日を持つ章でも日本語は日本語の公開日のまま", async () => {
    setupLocaleTranslations({
      ja: {
        [NAMESPACE]: { pageTitle: "雀頭の符計算", pageDescription: "説明" },
      },
    });
    translatedAtOverride.value = { en: "2026-12-01" };

    const metadata = await createLearnMetadata("jantou-fu");

    expect(metadata.openGraph).toMatchObject({
      publishedTime: `${PUBLISHED_AT}T00:00:00+09:00`,
    });
  });
});
