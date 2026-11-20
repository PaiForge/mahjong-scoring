import { describe, expect, it } from "vitest";
import {
  FuroType,
  HaiKind,
  MentsuType,
  Tacha,
  type CompletedMentsu,
} from "@pai-forge/riichi-mahjong";

import { fromArchivedMeld, toArchivedMeld, toHaiKindIds } from "./melds";
import type { ArchivedFrom } from "./types";

describe("toHaiKindIds", () => {
  it("範囲内の整数だけの列はそのまま牌種 ID の列にする", () => {
    expect(toHaiKindIds([0, 33, 9])).toEqual([0, 33, 9]);
  });

  it("空の列は空の列にする", () => {
    expect(toHaiKindIds([])).toEqual([]);
  });

  it.each([[[0, 34]], [[-1, 0]], [[0, 1.5]]])(
    "範囲外・整数でない値を 1 つでも含む列 %j は undefined",
    (values) => {
      expect(toHaiKindIds(values)).toBeUndefined();
    },
  );
});

describe("fromArchivedMeld: チー", () => {
  it("同じ数牌の連番 3 枚と、その中の鳴いた牌は上家からのチーに戻す", () => {
    expect(
      fromArchivedMeld({
        type: "chi",
        hais: [HaiKind.PinZu3, HaiKind.PinZu4, HaiKind.PinZu5],
        nakiHai: HaiKind.PinZu4,
      }),
    ).toEqual({
      type: MentsuType.Shuntsu,
      hais: [HaiKind.PinZu3, HaiKind.PinZu4, HaiKind.PinZu5],
      furo: {
        type: FuroType.Chi,
        from: Tacha.Kamicha,
        nakiHai: HaiKind.PinZu4,
      },
    });
  });

  it("鳴いた牌が面子に無いチーは戻さない", () => {
    expect(
      fromArchivedMeld({
        type: "chi",
        hais: [HaiKind.PinZu3, HaiKind.PinZu4, HaiKind.PinZu5],
        nakiHai: HaiKind.PinZu6,
      }),
    ).toBeUndefined();
  });

  it("鳴いた牌が牌種 ID の範囲外のチーは戻さない", () => {
    expect(
      fromArchivedMeld({
        type: "chi",
        hais: [HaiKind.PinZu3, HaiKind.PinZu4, HaiKind.PinZu5],
        nakiHai: 34,
      }),
    ).toBeUndefined();
  });

  it.each([
    ["2 枚目が連番でない", [HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu2]],
    ["3 枚目が連番でない", [HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu4]],
    ["昇順でない", [HaiKind.ManZu2, HaiKind.ManZu1, HaiKind.ManZu3]],
    ["2 枚目で花色をまたぐ", [HaiKind.ManZu9, HaiKind.PinZu1, HaiKind.PinZu2]],
    ["3 枚目で花色をまたぐ", [HaiKind.ManZu8, HaiKind.ManZu9, HaiKind.PinZu1]],
    ["字牌", [HaiKind.Ton, HaiKind.Nan, HaiKind.Sha]],
    ["2 枚", [HaiKind.ManZu1, HaiKind.ManZu2]],
    ["4 枚", [HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4]],
  ])("%s牌の並びはチーに戻さない", (_label, hais) => {
    expect(
      fromArchivedMeld({ type: "chi", hais, nakiHai: hais[0] ?? 0 }),
    ).toBeUndefined();
  });
});

describe("fromArchivedMeld: ポン・槓", () => {
  it.each([
    ["kamicha", Tacha.Kamicha],
    ["toimen", Tacha.Toimen],
    ["shimocha", Tacha.Shimocha],
  ] as const)(
    "同種 3 枚のポンは鳴き元 %s のまま戻す",
    (from: ArchivedFrom, tacha) => {
      expect(
        fromArchivedMeld({
          type: "pon",
          hais: [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku],
          from,
        }),
      ).toEqual({
        type: MentsuType.Koutsu,
        hais: [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku],
        furo: { type: FuroType.Pon, from: tacha, nakiHai: HaiKind.Haku },
      });
    },
  );

  it("同種 4 枚の大明槓は鳴き元のまま戻す", () => {
    expect(
      fromArchivedMeld({
        type: "daiminkan",
        hais: [HaiKind.SouZu7, HaiKind.SouZu7, HaiKind.SouZu7, HaiKind.SouZu7],
        from: "toimen",
      }),
    ).toEqual({
      type: MentsuType.Kantsu,
      hais: [HaiKind.SouZu7, HaiKind.SouZu7, HaiKind.SouZu7, HaiKind.SouZu7],
      furo: {
        type: FuroType.Daiminkan,
        from: Tacha.Toimen,
        nakiHai: HaiKind.SouZu7,
      },
    });
  });

  it("同種 4 枚の加槓は加えた牌を同じ牌として戻す", () => {
    expect(
      fromArchivedMeld({
        type: "kakan",
        hais: [HaiKind.Ton, HaiKind.Ton, HaiKind.Ton, HaiKind.Ton],
        from: "shimocha",
      }),
    ).toEqual({
      type: MentsuType.Kantsu,
      hais: [HaiKind.Ton, HaiKind.Ton, HaiKind.Ton, HaiKind.Ton],
      furo: {
        type: FuroType.Kakan,
        from: Tacha.Shimocha,
        nakiHai: HaiKind.Ton,
        kakanHai: HaiKind.Ton,
      },
    });
  });

  it("同種 4 枚の暗槓は副露の無い槓子に戻す", () => {
    expect(
      fromArchivedMeld({
        type: "ankan",
        hais: [HaiKind.ManZu9, HaiKind.ManZu9, HaiKind.ManZu9, HaiKind.ManZu9],
      }),
    ).toEqual({
      type: MentsuType.Kantsu,
      hais: [HaiKind.ManZu9, HaiKind.ManZu9, HaiKind.ManZu9, HaiKind.ManZu9],
    });
  });

  it.each([
    ["同種でない 3 枚", [HaiKind.Haku, HaiKind.Haku, HaiKind.Hatsu]],
    ["同種 4 枚", [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku, HaiKind.Haku]],
    ["同種 2 枚", [HaiKind.Haku, HaiKind.Haku]],
  ])("%sはポンに戻さない", (_label, hais) => {
    expect(fromArchivedMeld({ type: "pon", hais, from: "toimen" })).toBe(
      undefined,
    );
  });

  it.each(["daiminkan", "kakan", "ankan"] as const)(
    "同種 3 枚・同種でない 4 枚は %s に戻さない",
    (type) => {
      const three = [HaiKind.Hatsu, HaiKind.Hatsu, HaiKind.Hatsu];
      const mixed = [HaiKind.Hatsu, HaiKind.Hatsu, HaiKind.Hatsu, HaiKind.Chun];
      const meldOf = (hais: number[]) =>
        type === "ankan"
          ? { type, hais }
          : { type, hais, from: "toimen" as const };
      expect(fromArchivedMeld(meldOf(three))).toBeUndefined();
      expect(fromArchivedMeld(meldOf(mixed))).toBeUndefined();
    },
  );

  it("牌種 ID の範囲外の牌を含む副露は戻さない", () => {
    expect(
      fromArchivedMeld({ type: "pon", hais: [34, 34, 34], from: "toimen" }),
    ).toBeUndefined();
  });
});

describe("toArchivedMeld", () => {
  const meldedMentsu: readonly CompletedMentsu[] = [
    {
      type: MentsuType.Shuntsu,
      hais: [HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3],
      furo: {
        type: FuroType.Chi,
        from: Tacha.Kamicha,
        nakiHai: HaiKind.SouZu3,
      },
    },
    {
      type: MentsuType.Koutsu,
      hais: [HaiKind.Nan, HaiKind.Nan, HaiKind.Nan],
      furo: { type: FuroType.Pon, from: Tacha.Kamicha, nakiHai: HaiKind.Nan },
    },
    {
      type: MentsuType.Kantsu,
      hais: [HaiKind.PinZu2, HaiKind.PinZu2, HaiKind.PinZu2, HaiKind.PinZu2],
      furo: {
        type: FuroType.Daiminkan,
        from: Tacha.Shimocha,
        nakiHai: HaiKind.PinZu2,
      },
    },
    {
      type: MentsuType.Kantsu,
      hais: [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun, HaiKind.Chun],
      furo: {
        type: FuroType.Kakan,
        from: Tacha.Toimen,
        nakiHai: HaiKind.Chun,
        kakanHai: HaiKind.Chun,
      },
    },
    {
      type: MentsuType.Kantsu,
      hais: [HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5],
    },
  ];

  it("副露の種別・鳴いた牌・鳴き元を数値と文字列の形に書き出す", () => {
    expect(meldedMentsu.map(toArchivedMeld)).toEqual([
      {
        type: "chi",
        hais: [HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3],
        nakiHai: HaiKind.SouZu3,
      },
      {
        type: "pon",
        hais: [HaiKind.Nan, HaiKind.Nan, HaiKind.Nan],
        from: "kamicha",
      },
      {
        type: "daiminkan",
        hais: [HaiKind.PinZu2, HaiKind.PinZu2, HaiKind.PinZu2, HaiKind.PinZu2],
        from: "shimocha",
      },
      {
        type: "kakan",
        hais: [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun, HaiKind.Chun],
        from: "toimen",
      },
      {
        type: "ankan",
        hais: [HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5],
      },
    ]);
  });

  it("書き出した副露は fromArchivedMeld で元の面子に戻る", () => {
    expect(
      meldedMentsu.map((mentsu) => fromArchivedMeld(toArchivedMeld(mentsu))),
    ).toEqual(meldedMentsu);
  });
});
