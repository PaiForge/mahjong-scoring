import { describe, expect, it } from "vitest";

import {
  PREFERENCES_ITEM_PARAM,
  PREFERENCE_ANCHORS,
  preferencesHref,
  preferencesItemHref,
} from "./preference-anchors";

const anchors = Object.values(PREFERENCE_ANCHORS);

describe("PREFERENCE_ANCHORS", () => {
  // 値は web では要素の id と URL のハッシュ、アプリではクエリの値になる。
  // 空や重複があるとリンクが別の項目へ着地する（または先頭に留まる）
  it("どの項目のアンカーも空でない", () => {
    for (const anchor of anchors) {
      expect(anchor.length).toBeGreaterThan(0);
    }
  });

  it("2 つの項目が同じアンカーを共有しない", () => {
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it("アンカーはエスケープ無しで id・ハッシュ・クエリに置ける kebab-case", () => {
    for (const anchor of anchors) {
      expect(anchor).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });
});

describe("preferencesHref", () => {
  it("設定ページのパスのハッシュに項目を置く", () => {
    expect(preferencesHref(PREFERENCE_ANCHORS.renfonpai)).toBe(
      "/preferences#renfonpai",
    );
  });
});

describe("preferencesItemHref", () => {
  it("アプリの設定画面のパスのクエリに項目を置く", () => {
    expect(preferencesItemHref(PREFERENCE_ANCHORS.kiriageMangan)).toBe(
      "/preferences?item=kiriage-mangan",
    );
  });

  it("クエリの名前は item（アプリの画面が読む名前）", () => {
    expect(PREFERENCES_ITEM_PARAM).toBe("item");
  });
});
