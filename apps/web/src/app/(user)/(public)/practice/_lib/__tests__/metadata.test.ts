import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetTranslations } = vi.hoisted(() => ({
  mockGetTranslations: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: mockGetTranslations,
}));

import { SITE_NAME } from "@/app/_lib/metadata";

import {
  createPracticeMetadata,
  createPracticePlayMetadata,
  createPracticeTrainingMetadata,
} from "../metadata";

/** 名前空間ごとの辞書を引く翻訳関数を組み立てる */
function setupTranslations(dict: Record<string, Record<string, string>>) {
  mockGetTranslations.mockImplementation((namespace: string) =>
    Promise.resolve((key: string) => dict[namespace]?.[key] ?? `?${key}`),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createPracticeMetadata", () => {
  it("slug から導出した canonical を持ち、index 可能", async () => {
    setupTranslations({
      jantouFu: { title: "雀頭符", description: "説明" },
    });

    const metadata = await createPracticeMetadata("jantouFu", "jantou-fu");

    expect(metadata).toMatchObject({
      title: `雀頭符 - ${SITE_NAME}`,
      alternates: { canonical: "/practice/jantou-fu" },
    });
    expect(metadata).not.toHaveProperty("robots");
  });
});

describe("createPracticePlayMetadata", () => {
  it("noindex, follow で canonical を持たない", async () => {
    setupTranslations({ jantouFu: { title: "雀頭符" } });

    const metadata = await createPracticePlayMetadata("jantouFu");

    expect(metadata).toMatchObject({
      title: `雀頭符 - ${SITE_NAME}`,
      robots: { index: false, follow: true },
    });
    expect(metadata).not.toHaveProperty("alternates");
    expect(metadata).not.toHaveProperty("description");
  });
});

describe("createPracticeTrainingMetadata", () => {
  it("説明付きで noindex, follow", async () => {
    setupTranslations({
      jantouFu: { title: "雀頭符", description: "説明" },
    });

    await expect(
      createPracticeTrainingMetadata("jantouFu"),
    ).resolves.toMatchObject({
      title: `雀頭符 - ${SITE_NAME}`,
      description: "説明",
      robots: { index: false, follow: true },
    });
  });
});
