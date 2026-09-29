import { describe, expect, it } from "vitest";

import { validateAdCreative } from "../../src/app/admin/ads/_lib/validation";
import { isValidAsin } from "../../src/lib/ads/amazon";
import { AD_SLOT_VALUES } from "../../src/lib/ads/registry";

import { SEED_AD_CREATIVES } from "./ad-creatives";

describe("SEED_AD_CREATIVES", () => {
  it("どの行も管理画面の検証を通る（編集してそのまま保存できる）", () => {
    for (const { row, copy } of SEED_AD_CREATIVES) {
      const result = validateAdCreative(
        {
          slot: row.slot,
          asin: row.asin ?? "",
          href: row.href ?? "",
          isActive: row.isActive ?? false,
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

  it("ASIN で本を指し、URL（トラッキング ID 入りのリンク）をコードに書かない", () => {
    for (const { row } of SEED_AD_CREATIVES) {
      expect(isValidAsin(row.asin ?? "")).toBe(true);
      expect(row.href).toBeNull();
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
