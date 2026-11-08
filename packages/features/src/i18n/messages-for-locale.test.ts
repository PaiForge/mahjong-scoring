import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";
import { describe, expect, it } from "vitest";

import { messagesForLocale } from "./messages-for-locale";

describe("messagesForLocale", () => {
  it("ja は日本語の全辞書", () => {
    expect(messagesForLocale("ja")).toBe(jaMessages);
  });

  it("en は英語の完訳の束（日本語の辞書を混ぜない）", () => {
    expect(messagesForLocale("en")).toBe(enMessages);
    expect(messagesForLocale("en")).not.toBe(jaMessages);
  });
});
