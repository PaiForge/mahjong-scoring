import { describe, it, expect } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";
import {
  YAKU_NAME_MAP,
  SELECTABLE_YAKU,
  EXCLUDED_YAKU_FROM_ANSWER,
  getKazeYakuhaiDisplayName,
} from "./constants";

describe("YAKU_NAME_MAP", () => {
  it("三元牌の役牌が含まれる", () => {
    expect(YAKU_NAME_MAP["Haku"]).toBe("役牌 白");
    expect(YAKU_NAME_MAP["Hatsu"]).toBe("役牌 發");
    expect(YAKU_NAME_MAP["Chun"]).toBe("役牌 中");
  });

  it("基本的な1翻役が含まれる", () => {
    expect(YAKU_NAME_MAP["Tanyao"]).toBe("断么九");
    expect(YAKU_NAME_MAP["Pinfu"]).toBe("平和");
    expect(YAKU_NAME_MAP["MenzenTsumo"]).toBe("門前清自摸和");
  });

  it("役満が含まれる", () => {
    expect(YAKU_NAME_MAP["KokushiMusou"]).toBe("国士無双");
    expect(YAKU_NAME_MAP["Suuankou"]).toBe("四暗刻");
    expect(YAKU_NAME_MAP["Daisangen"]).toBe("大三元");
  });
});

describe("SELECTABLE_YAKU", () => {
  it("36種の役が含まれる", () => {
    expect(SELECTABLE_YAKU).toHaveLength(36);
  });

  it("立直が含まれる", () => {
    expect(SELECTABLE_YAKU).toContain("立直");
  });

  it("門前清自摸和が含まれる", () => {
    expect(SELECTABLE_YAKU).toContain("門前清自摸和");
  });

  it("風牌の役牌が含まれる", () => {
    expect(SELECTABLE_YAKU).toContain("役牌 東");
    expect(SELECTABLE_YAKU).toContain("役牌 南");
    expect(SELECTABLE_YAKU).toContain("役牌 西");
    expect(SELECTABLE_YAKU).toContain("役牌 北");
  });

  it("ドラや偶然役は含まれない", () => {
    expect(SELECTABLE_YAKU).not.toContain("ドラ");
    expect(SELECTABLE_YAKU).not.toContain("裏ドラ");
    expect(SELECTABLE_YAKU).not.toContain("一発");
    expect(SELECTABLE_YAKU).not.toContain("海底摸月");
    expect(SELECTABLE_YAKU).not.toContain("ダブル立直");
    expect(SELECTABLE_YAKU).not.toContain("天和");
    expect(SELECTABLE_YAKU).not.toContain("地和");
  });
});

describe("EXCLUDED_YAKU_FROM_ANSWER", () => {
  it("偶然役が含まれる", () => {
    expect(EXCLUDED_YAKU_FROM_ANSWER.has("Ippatsu")).toBe(true);
    expect(EXCLUDED_YAKU_FROM_ANSWER.has("Haitei")).toBe(true);
    expect(EXCLUDED_YAKU_FROM_ANSWER.has("Houtei")).toBe(true);
    expect(EXCLUDED_YAKU_FROM_ANSWER.has("Rinshan")).toBe(true);
    expect(EXCLUDED_YAKU_FROM_ANSWER.has("Chankan")).toBe(true);
  });
});

describe("YAKU_NAME_MAP — 網羅性", () => {
  it("風牌の役牌は YAKU_NAME_MAP に含まれない（別途 getKazeYakuhaiDisplayName で処理）", () => {
    const values = Object.values(YAKU_NAME_MAP);
    expect(values).not.toContain("役牌 東");
    expect(values).not.toContain("役牌 南");
    expect(values).not.toContain("役牌 西");
    expect(values).not.toContain("役牌 北");
  });
});

describe("SELECTABLE_YAKU — 重複チェック", () => {
  it("重複する要素が存在しない", () => {
    const unique = new Set(SELECTABLE_YAKU);
    expect(unique.size).toBe(SELECTABLE_YAKU.length);
  });
});

describe("EXCLUDED_YAKU_FROM_ANSWER — YAKU_NAME_MAP との重複チェック", () => {
  it("EXCLUDED_YAKU_FROM_ANSWER のキーが YAKU_NAME_MAP の値に変換されない", () => {
    for (const excludedKey of EXCLUDED_YAKU_FROM_ANSWER) {
      expect(YAKU_NAME_MAP[excludedKey]).toBeUndefined();
    }
  });
});

describe("getKazeYakuhaiDisplayName", () => {
  it("東風を正しく変換する", () => {
    expect(getKazeYakuhaiDisplayName(HaiKind.Ton)).toBe("役牌 東");
  });

  it("南風を正しく変換する", () => {
    expect(getKazeYakuhaiDisplayName(HaiKind.Nan)).toBe("役牌 南");
  });

  it("西風を正しく変換する", () => {
    expect(getKazeYakuhaiDisplayName(HaiKind.Sha)).toBe("役牌 西");
  });

  it("北風を正しく変換する", () => {
    expect(getKazeYakuhaiDisplayName(HaiKind.Pei)).toBe("役牌 北");
  });
});
