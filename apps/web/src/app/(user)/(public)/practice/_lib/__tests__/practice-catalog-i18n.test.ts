import { describe, expect, it } from "vitest";

import messages from "@/messages/ja.json";
import {
  PRACTICE_CATALOG,
  practiceTitleKey,
} from "@mahjong-scoring/features/practice/catalog";

describe("段級位の辞書", () => {
  it("段級位名とリンクの読み上げ文が辞書に存在する", () => {
    const names: Record<string, string> = messages.ranks.names;
    for (const menu of PRACTICE_CATALOG) {
      if (menu.rank === undefined) continue;
      expect(names[menu.rank], `${menu.slug}`).toBeTruthy();
    }
    expect(messages.ranks.examTitle.kyu).toContain("{rank}");
    expect(messages.ranks.examTitle.dan).toContain("{rank}");
    expect(messages.ranks.practiceLink.title).toContain("{rank}");
    expect(messages.ranks.practiceLink.description).toBeTruthy();
  });
});

describe("i18n キーの導出", () => {
  it("全練習の名前が辞書に存在する", () => {
    const practices: Record<string, { title: string }> =
      messages.practice.practices;
    for (const menu of PRACTICE_CATALOG) {
      const titleKey = practiceTitleKey(menu.slug);
      // "practices.<messageKey>.title" の messageKey 部分を取り出して引く
      const messageKey = titleKey.split(".")[1] ?? "";
      expect(practices[messageKey]?.title).toBeTruthy();
    }
  });
});
