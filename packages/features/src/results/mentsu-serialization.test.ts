import { describe, expect, it } from "vitest";
import { FuroType, HaiKind, MentsuType, Tacha } from "@mahjong-scoring/core";

import {
  restoreMentsu,
  serializedMentsuSchema,
  toSerializedMentsu,
} from "./mentsu-serialization";

describe("serializedMentsuSchema", () => {
  it("鳴いた牌を持つ副露を受け付ける", () => {
    const value = {
      tiles: "555p",
      type: MentsuType.Koutsu,
      furo: { type: FuroType.Pon, from: Tacha.Toimen, nakiHai: 13 },
    };
    expect(serializedMentsuSchema.safeParse(value).success).toBe(true);
  });

  it("加槓は加槓牌まで持てば受け付ける", () => {
    const furo = { type: FuroType.Kakan, from: Tacha.Toimen, nakiHai: 13 };
    const base = { tiles: "5555p", type: MentsuType.Kantsu };
    expect(
      serializedMentsuSchema.safeParse({
        ...base,
        furo: { ...furo, kakanHai: 13 },
      }).success,
    ).toBe(true);
    expect(serializedMentsuSchema.safeParse({ ...base, furo }).success).toBe(
      false,
    );
  });

  it("鳴いた牌を持たない旧形式の副露は弾く", () => {
    // riichi-mahjong 0.x の Furo（鳴き元だけ）で保存された結果
    const legacy = {
      tiles: "555p",
      type: MentsuType.Koutsu,
      furo: { type: FuroType.Pon, from: Tacha.Toimen },
    };
    expect(serializedMentsuSchema.safeParse(legacy).success).toBe(false);
  });

  it("上家以外からのチーと牌種IDの範囲外の牌は弾く", () => {
    const base = { tiles: "123m", type: MentsuType.Shuntsu };
    expect(
      serializedMentsuSchema.safeParse({
        ...base,
        furo: { type: FuroType.Chi, from: Tacha.Toimen, nakiHai: 0 },
      }).success,
    ).toBe(false);
    expect(
      serializedMentsuSchema.safeParse({
        ...base,
        furo: { type: FuroType.Chi, from: Tacha.Kamicha, nakiHai: 34 },
      }).success,
    ).toBe(false);
  });
});

describe("toSerializedMentsu / restoreMentsu", () => {
  it("鳴いた牌ごと往復する", () => {
    const mentsu = {
      type: MentsuType.Shuntsu,
      hais: [HaiKind.SouZu2, HaiKind.SouZu3, HaiKind.SouZu4],
      furo: {
        type: FuroType.Chi,
        from: Tacha.Kamicha,
        nakiHai: HaiKind.SouZu2,
      },
    } as const;
    const serialized = toSerializedMentsu(mentsu);

    expect(serialized.tiles).toBe("234s");
    expect(serializedMentsuSchema.safeParse(serialized).success).toBe(true);
    expect(restoreMentsu(serialized)).toEqual(mentsu);
  });
});
