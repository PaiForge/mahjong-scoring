import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetTranslations } = vi.hoisted(() => ({
  mockGetTranslations: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: mockGetTranslations,
}));

import {
  createMetadata,
  createNamespaceMetadata,
  createResultMetadata,
  createTitleOnlyMetadata,
  SITE_NAME,
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

describe("createNamespaceMetadata", () => {
  it("既定では title / description キーを引く", async () => {
    setupTranslations({
      jantouFu: { title: "雀頭符", description: "雀頭の符を学ぶ" },
    });

    await expect(createNamespaceMetadata("jantouFu")).resolves.toEqual({
      title: `雀頭符 - ${SITE_NAME}`,
      description: "雀頭の符を学ぶ",
    });
  });

  it("キー名を上書きできる（pageTitle / pageDescription）", async () => {
    setupTranslations({
      scoreTable: { pageTitle: "点数表", pageDescription: "早見表" },
    });

    await expect(
      createNamespaceMetadata("scoreTable", {
        title: "pageTitle",
        description: "pageDescription",
      }),
    ).resolves.toEqual({
      title: `点数表 - ${SITE_NAME}`,
      description: "早見表",
    });
  });
});

describe("createTitleOnlyMetadata", () => {
  it("description を引かない（辞書に無いキーを参照しない）", async () => {
    setupTranslations({ jantouFu: { title: "雀頭符" } });

    const metadata = await createTitleOnlyMetadata("jantouFu");

    expect(metadata).toEqual({ title: `雀頭符 - ${SITE_NAME}` });
    expect(metadata).not.toHaveProperty("description");
  });

  it("タイトルのキーを上書きできる", async () => {
    setupTranslations({ scoreTable: { pageTitle: "点数表" } });

    await expect(
      createTitleOnlyMetadata("scoreTable", "pageTitle"),
    ).resolves.toEqual({ title: `点数表 - ${SITE_NAME}` });
  });
});

describe("createResultMetadata", () => {
  it("「<練習名> - <結果サフィックス>」を組み立てる", async () => {
    setupTranslations({
      jantouFu: { title: "雀頭符" },
      challenge: { resultSuffix: "結果" },
    });

    await expect(createResultMetadata("jantouFu")).resolves.toEqual({
      title: `雀頭符 - 結果 - ${SITE_NAME}`,
    });
  });

  it("練習の名前空間と challenge の両方を引く", async () => {
    setupTranslations({
      yakuHanChallenge: { title: "役の翻数" },
      challenge: { resultSuffix: "結果" },
    });

    await createResultMetadata("yakuHanChallenge");

    expect(mockGetTranslations).toHaveBeenCalledWith("yakuHanChallenge");
    expect(mockGetTranslations).toHaveBeenCalledWith("challenge");
  });
});

describe("createMetadata", () => {
  it("サイト名を付けた title を返す", () => {
    expect(createMetadata({ title: "練習" })).toEqual({
      title: `練習 - ${SITE_NAME}`,
    });
  });

  it("description を渡すとそのまま含める", () => {
    expect(createMetadata({ title: "練習", description: "説明" })).toEqual({
      title: `練習 - ${SITE_NAME}`,
      description: "説明",
    });
  });
});
