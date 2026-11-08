import { describe, expect, it } from "vitest";

import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import {
  collectTermSlugsInDictionary,
  collectTermSlugsInNamespace,
} from "./message-terms";

describe("collectTermSlugsInNamespace", () => {
  it("存在しない名前空間では空配列を返す", () => {
    expect(collectTermSlugsInNamespace("noSuchChapter.learn")).toEqual([]);
  });

  it("マークアップを持たない名前空間では空配列を返す", () => {
    expect(collectTermSlugsInNamespace("glossary.categories")).toEqual([]);
  });

  it("配列を含む名前空間を走査しても落ちない", () => {
    expect(collectTermSlugsInNamespace("common")).toBeInstanceOf(Array);
  });

  it("日本語の辞書を走査した結果と同じ", () => {
    expect(collectTermSlugsInNamespace("mentsuFu")).toEqual(
      collectTermSlugsInDictionary(jaMessages, "mentsuFu"),
    );
  });
});

describe("英語の本文の用語リンク", () => {
  /**
   * 英語のページも日本語の辞書の走査結果でモーダルの用語を決める。英語の
   * 本文にだけ現れる slug があると、そのリンクは英語でモーダルが開かない。
   */
  it.each(Object.keys(enMessages).map((namespace) => [namespace]))(
    "%s の英語の本文は、日本語の本文に無い slug を参照しない",
    (namespace) => {
      const ja = new Set(collectTermSlugsInDictionary(jaMessages, namespace));
      const onlyInEnglish = collectTermSlugsInDictionary(
        enMessages,
        namespace,
      ).filter((slug) => !ja.has(slug));
      expect(onlyInEnglish).toEqual([]);
    },
  );
});
