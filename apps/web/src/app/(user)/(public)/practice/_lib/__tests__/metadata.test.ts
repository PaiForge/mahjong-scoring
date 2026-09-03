import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "next-intl/server",
  async () => await import("@/test/intl-namespace-mock"),
);

import { setupTranslations } from "@/test/intl-namespace-mock";

import { SITE_NAME } from "@/app/_lib/metadata";

import {
  createPracticeMetadata,
  createPracticePlayMetadata,
  createPracticeTrainingMetadata,
} from "../metadata";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createPracticeMetadata", () => {
  it("canonical と辞書ネームスペースを slug から導出し、index 可能", async () => {
    setupTranslations({
      jantouFu: { title: "雀頭符", description: "説明" },
    });

    const metadata = await createPracticeMetadata("jantou-fu");

    expect(metadata).toMatchObject({
      title: `雀頭符 - ${SITE_NAME}`,
      alternates: { canonical: "/practice/jantou-fu" },
    });
    expect(metadata).not.toHaveProperty("robots");
  });
});

describe("createPracticePlayMetadata", () => {
  it("辞書ネームスペースを slug から導出し、noindex, follow で canonical を持たない", async () => {
    setupTranslations({ jantouFu: { title: "雀頭符" } });

    const metadata = await createPracticePlayMetadata("jantou-fu");

    expect(metadata).toMatchObject({
      title: `雀頭符 - ${SITE_NAME}`,
      robots: { index: false, follow: true },
    });
    expect(metadata).not.toHaveProperty("alternates");
    expect(metadata).not.toHaveProperty("description");
  });
});

describe("createPracticeTrainingMetadata", () => {
  it("辞書ネームスペースを slug から導出し、説明付きで noindex, follow", async () => {
    setupTranslations({
      jantouFu: { title: "雀頭符", description: "説明" },
    });

    await expect(
      createPracticeTrainingMetadata("jantou-fu"),
    ).resolves.toMatchObject({
      title: `雀頭符 - ${SITE_NAME}`,
      description: "説明",
      robots: { index: false, follow: true },
    });
  });
});
