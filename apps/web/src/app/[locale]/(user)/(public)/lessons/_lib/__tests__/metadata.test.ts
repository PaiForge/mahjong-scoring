import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "next-intl/server",
  async () => await import("@/app/_lib/__tests__/locale-intl-mock"),
);

import { setupLocaleTranslations } from "@/app/_lib/__tests__/locale-intl-mock";

import { chapterNamespace } from "@mahjong-scoring/features/curriculum/chapter-namespace";
import { getChapterBySlug } from "@mahjong-scoring/features/curriculum/registry";

import { createLearnMetadata } from "../metadata";

const NAMESPACE = chapterNamespace("jantou-fu");
const PUBLISHED_AT = getChapterBySlug("jantou-fu")?.publishedAt;

beforeEach(() => {
  vi.clearAllMocks();
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
});
