import { describe, expect, it } from "vitest";

import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import { lessonExcerpt } from "./excerpt";
import { QUIZ_LESSON_SLUGS, quizLessonBySlug } from "./registry";

/** ドット区切りのキーで辞書の文字列を引く。無ければ undefined */
function resolveKey(dictionary: unknown, key: string): string | undefined {
  let node: unknown = dictionary;
  for (const segment of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Readonly<Record<string, unknown>>)[segment];
  }
  return typeof node === "string" ? node : undefined;
}

/** 引いたキーを記録し、辞書に無いキーは例外にする翻訳関数 */
function recordingTranslator(dictionary: unknown): {
  readonly t: (key: string) => string;
  readonly keys: readonly string[];
} {
  const keys: string[] = [];
  return {
    keys,
    t: (key) => {
      keys.push(key);
      const value = resolveKey(dictionary, key);
      if (value === undefined) throw new Error(`辞書に無いキー: ${key}`);
      return value;
    },
  };
}

describe("lessonExcerpt", () => {
  it.each(QUIZ_LESSON_SLUGS)(
    "%s: 自分の章の本文（learn）の相異なる段落を 2 つ以上、日本語の辞書から引く",
    (slug) => {
      const { t, keys } = recordingTranslator(jaMessages);
      const paragraphs = lessonExcerpt(slug, t);

      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
      expect(new Set(keys).size).toBe(keys.length);
      const namespace = quizLessonBySlug(slug)?.messageKey;
      for (const key of keys) {
        expect(key.startsWith(`${namespace}.learn.`), key).toBe(true);
      }
      for (const paragraph of paragraphs) {
        expect(paragraph.trim()).not.toBe("");
        // 抜粋はリンクを置かないので、用語マークアップは外れている
        expect(paragraph, slug).not.toContain("[[");
      }
    },
  );

  it.each(QUIZ_LESSON_SLUGS)("%s: 英語の辞書にも同じ段落がある", (slug) => {
    const { t } = recordingTranslator(enMessages);
    expect(() => lessonExcerpt(slug, t)).not.toThrow();
  });

  it("用語マークアップを外して表示語だけを残す", () => {
    expect(
      lessonExcerpt("jantou-fu", (key) => `[[jantou|雀頭]]は${key}`),
    ).toEqual([
      "雀頭はjantouFu.learn.whatIsJantouBody",
      "雀頭はjantouFu.learn.yakuhaiBody",
    ]);
  });
});
