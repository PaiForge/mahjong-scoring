import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "next-intl/server",
  async () => await import("@/app/_lib/__tests__/locale-intl-mock"),
);

import {
  mockGetTranslations,
  setupLocaleTranslations,
} from "@/app/_lib/__tests__/locale-intl-mock";

import { SITE_NAME } from "@/app/_lib/metadata";

import {
  createFreePracticePlayMetadata,
  createPracticeMetadata,
  createPracticePlayMetadata,
  createPracticeTrainingMetadata,
} from "../metadata";

beforeEach(() => {
  vi.clearAllMocks();
});

/** 日本語の辞書だけを差し込む（locale を省略したヘルパーは日本語で引く） */
function setupTranslations(dict: Record<string, Record<string, string>>) {
  setupLocaleTranslations({ ja: dict });
}

describe("createPracticeMetadata", () => {
  it("canonical と辞書ネームスペースを slug から導出し、index 可能", async () => {
    setupTranslations({
      jantouFu: { title: "雀頭符", description: "説明" },
      practice: { introTitle: "{title}の練習" },
    });

    const metadata = await createPracticeMetadata("jantou-fu");

    // title は教本の同名章と衝突しないよう「〜の練習」（h1 は練習名のまま）
    expect(metadata).toMatchObject({
      title: `雀頭符の練習 - ${SITE_NAME}`,
      description: "説明",
      alternates: { canonical: "/practice/jantou-fu" },
    });
    expect(metadata).not.toHaveProperty("robots");
  });

  it("昇級試験は試験名をそのまま title にする", async () => {
    setupTranslations({
      manganExamChallenge: { title: "昇級試験：満貫", description: "説明" },
      practice: { introTitle: "{title}の練習" },
    });

    const metadata = await createPracticeMetadata("mangan-exam");

    expect(metadata).toMatchObject({
      title: `昇級試験：満貫 - ${SITE_NAME}`,
      alternates: { canonical: "/exam/mangan" },
    });
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

describe("locale を渡したとき", () => {
  it("説明ページは英語の辞書で組み、canonical は英語のパスになる", async () => {
    setupLocaleTranslations({
      en: {
        jantouFu: { title: "Pair fu", description: "About pair fu" },
        practice: { introTitle: "{title} practice" },
      },
    });

    const metadata = await createPracticeMetadata("jantou-fu", {
      locale: "en",
    });

    expect(metadata).toMatchObject({
      title: `Pair fu practice - ${SITE_NAME}`,
      description: "About pair fu",
      alternates: { canonical: "/en/practice/jantou-fu" },
      openGraph: { locale: "en_US", url: "/en/practice/jantou-fu" },
    });
    expect(mockGetTranslations).toHaveBeenCalledWith({
      locale: "en",
      namespace: "practice",
    });
  });

  it("play・自由練習・training も言語を辞書の引き先に通す", async () => {
    setupLocaleTranslations({
      en: {
        jantouFu: { title: "Pair fu", description: "About pair fu" },
        score: { title: "Scoring" },
        manganExamChallenge: { title: "Exam: mangan" },
        examTraining: { pageTitle: "{title} (mock exam)" },
      },
    });

    await expect(
      createPracticePlayMetadata("jantou-fu", { locale: "en" }),
    ).resolves.toMatchObject({
      title: `Pair fu - ${SITE_NAME}`,
      robots: { index: false, follow: true },
    });
    await expect(
      createFreePracticePlayMetadata("score", { locale: "en" }),
    ).resolves.toMatchObject({ title: `Scoring - ${SITE_NAME}` });
    await expect(
      createPracticeTrainingMetadata("jantou-fu", { locale: "en" }),
    ).resolves.toMatchObject({
      title: `Pair fu - ${SITE_NAME}`,
      description: "About pair fu",
    });
    await expect(
      createPracticeTrainingMetadata("mangan-exam", { locale: "en" }),
    ).resolves.toMatchObject({
      title: `Exam: mangan (mock exam) - ${SITE_NAME}`,
      openGraph: { locale: "en_US" },
    });
  });

  it("locale を省略すると日本語の辞書を明示して引く（リクエストのロケールに落とさない）", async () => {
    setupTranslations({
      jantouFu: { title: "雀頭符", description: "説明" },
      practice: { introTitle: "{title}の練習" },
    });

    const implicit = await createPracticeMetadata("jantou-fu");
    const explicit = await createPracticeMetadata("jantou-fu", {
      locale: "ja",
    });

    expect(explicit).toEqual(implicit);
    expect(mockGetTranslations).toHaveBeenCalledWith({
      locale: "ja",
      namespace: "jantouFu",
    });
  });
});
