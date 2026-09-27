import { describe, expect, it } from "vitest";

import { validateAdCreative } from "../../src/app/admin/ads/_lib/validation";
import { isPlaceholderAdHref } from "../../src/lib/ads/placeholder";
import { AD_SLOT_VALUES } from "../../src/lib/ads/registry";

import { SEED_AD_CREATIVES } from "./ad-creatives";

describe("SEED_AD_CREATIVES", () => {
  it("どの行も管理画面の検証を通る（編集してそのまま保存できる）", () => {
    for (const { row, copy } of SEED_AD_CREATIVES) {
      const result = validateAdCreative(
        {
          slot: row.slot,
          href: row.href,
          isActive: false,
          icon: row.icon ?? "",
          imageUrl: "",
          imageAlt: "",
          hand: row.hand ?? "",
          title: { ja: copy.title.ja ?? "" },
          description: { ja: copy.description.ja ?? "" },
        },
        "https://example.supabase.co/storage/v1/object/public/ad-creatives/",
      );
      expect(result, `${row.slot} / ${row.id}`).toMatchObject({ ok: true });
    }
  });

  it("すべて停止中・仮リンクで入る（アフィリエイトリンクをコードに書かない）", () => {
    for (const { row } of SEED_AD_CREATIVES) {
      expect(row.isActive).toBe(false);
      expect(isPlaceholderAdHref(row.href)).toBe(true);
    }
  });

  it("id は重複しない", () => {
    const ids = SEED_AD_CREATIVES.map(({ row }) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("どのスロットにも 1 件以上ある", () => {
    const slots = new Set(SEED_AD_CREATIVES.map(({ row }) => row.slot));
    expect([...slots].sort()).toEqual([...AD_SLOT_VALUES].sort());
  });
});
