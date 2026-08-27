import { describe, it, expect } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";
import {
  YAKU_NAME_MAP,
  SELECTABLE_YAKU,
  SELECTABLE_YAKU_GROUPS,
  EXCLUDED_YAKU_FROM_ANSWER,
  getKazeYakuhaiDisplayName,
} from "./constants";
import { findYakuHanEntry, YAKUMAN_HAN } from "../yaku-han/constants";

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

describe("SELECTABLE_YAKU_GROUPS", () => {
  it("選択可能な役を過不足なく振り分ける", () => {
    const grouped = SELECTABLE_YAKU_GROUPS.flatMap((group) => group.names);

    expect(grouped).toHaveLength(SELECTABLE_YAKU.length);
    expect(new Set(grouped)).toEqual(new Set(SELECTABLE_YAKU));
  });

  it("同じ役が複数のグループに属さない", () => {
    const grouped = SELECTABLE_YAKU_GROUPS.flatMap((group) => group.names);

    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it("グループ内の並びが SELECTABLE_YAKU の並びを保つ", () => {
    for (const group of SELECTABLE_YAKU_GROUPS) {
      const indexes = group.names.map((name) => SELECTABLE_YAKU.indexOf(name));
      expect(
        [...indexes].sort((a, b) => a - b),
        `${group.kind} の並び`,
      ).toEqual(indexes);
    }
  });

  it("門前限定グループの役は鳴くと成立しない", () => {
    const group = SELECTABLE_YAKU_GROUPS.find((g) => g.kind === "menzenOnly");

    expect(group?.names).toEqual([
      "立直",
      "門前清自摸和",
      "平和",
      "一盃口",
      "七対子",
      "二盃口",
    ]);
  });

  it("食い下がりグループの役は鳴くと翻数が下がる", () => {
    const group = SELECTABLE_YAKU_GROUPS.find((g) => g.kind === "kuisagari");

    // 門前3翻・鳴き2翻の混一色と、門前6翻・鳴き5翻の清一色が同じグループに入る
    // （翻数ではなく鳴きの扱いで分類している）
    expect(group?.names).toEqual([
      "三色同順",
      "一気通貫",
      "混全帯么九",
      "混一色",
      "純全帯么九",
      "清一色",
    ]);
    for (const name of group?.names ?? []) {
      const entry = findYakuHanEntry(name);
      expect(entry?.nakiHan, `${name} の鳴き翻数`).toBeDefined();
      expect(entry?.nakiHan, `${name} は鳴くと下がる`).not.toBe(
        entry?.menzenHan,
      );
    }
  });

  it("食い下がりなしグループの役は鳴いても翻数が変わらない", () => {
    const group = SELECTABLE_YAKU_GROUPS.find((g) => g.kind === "noKuisagari");

    expect(group?.names).toContain("断么九");
    expect(group?.names).toContain("役牌 白");
    expect(group?.names).toContain("対々和");
    for (const name of group?.names ?? []) {
      const entry = findYakuHanEntry(name);
      expect(entry?.nakiHan, `${name} の鳴き翻数`).toBe(entry?.menzenHan);
      expect(entry?.menzenHan, `${name} の門前翻数`).not.toBe(YAKUMAN_HAN);
    }
  });

  it("役満グループは門前限定の役満も含む", () => {
    const group = SELECTABLE_YAKU_GROUPS.find((g) => g.kind === "yakuman");

    expect(group?.names).toContain("国士無双");
    expect(group?.names).toContain("大三元");
    for (const name of group?.names ?? []) {
      expect(findYakuHanEntry(name)?.menzenHan, `${name} の翻数`).toBe(
        YAKUMAN_HAN,
      );
    }
  });
});
