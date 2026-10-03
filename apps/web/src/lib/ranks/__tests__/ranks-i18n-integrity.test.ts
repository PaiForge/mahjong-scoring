import { describe, expect, it } from "vitest";

import { messages as messagesJson } from "@mahjong-scoring/messages/ja";
import { RANK_SLUGS, rankTier } from "@mahjong-scoring/features/ranks/registry";

/**
 * 段級位名は `ranks.names.<slug>` / 合格基準は `ranks.criteria.<slug>` を引く。
 * レジストリに1件足しても JSON の追記漏れは実行時まで検出されないため、
 * ここで突き合わせる（practice-menu-i18n-integrity.test.ts と同じパターン）。
 */
describe("i18n integrity: ranks", () => {
  const messages = messagesJson as unknown as {
    readonly ranks: {
      readonly names: Record<string, unknown>;
      readonly criteria: Record<string, unknown>;
    };
  };

  it.each(["names", "criteria"] as const)(
    "ranks.%s が全スラッグを持ち、余分を持たない",
    (section) => {
      const keys = Object.keys(messages.ranks[section]).sort();
      expect(keys).toEqual([...RANK_SLUGS].sort());
    },
  );
});

describe("i18n integrity: rank tiers", () => {
  it("種別ごとの文言が辞書に揃っている", () => {
    // `rankTier` の戻り値はそのまま i18n のキーの末尾になるため、
    // 種別を足したら文言も足す必要がある
    const tiers = [...new Set(RANK_SLUGS.map(rankTier))].sort();
    const messages = messagesJson as unknown as {
      readonly ranks: {
        readonly examTitle: Record<string, unknown>;
        readonly promotion: {
          readonly title: Record<string, unknown>;
          readonly message: Record<string, unknown>;
        };
      };
    };

    for (const section of [
      messages.ranks.examTitle,
      messages.ranks.promotion.title,
      messages.ranks.promotion.message,
    ]) {
      expect(Object.keys(section).sort()).toEqual(tiers);
    }
  });
});
