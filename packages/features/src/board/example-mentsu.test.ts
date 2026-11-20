import { describe, expect, it } from "vitest";
import { FuroType, HaiKind, MentsuType, Tacha } from "@mahjong-scoring/core";

import {
  exampleAnkan,
  exampleAnkou,
  exampleChii,
  exampleMinkan,
  exampleMinkou,
  exampleShuntsu,
} from "./example-mentsu";

const SHUNTSU = [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4] as const;

describe("例示の面子", () => {
  it("順子は鳴きを付けずに 3 枚を並べる", () => {
    expect(exampleShuntsu(SHUNTSU)).toEqual({
      type: MentsuType.Shuntsu,
      hais: SHUNTSU,
    });
  });

  it("チーは上家から鳴いた順子で、先頭の牌を鳴いた牌にする", () => {
    expect(exampleChii(SHUNTSU)).toEqual({
      type: MentsuType.Shuntsu,
      hais: SHUNTSU,
      furo: {
        type: FuroType.Chi,
        from: Tacha.Kamicha,
        nakiHai: HaiKind.ManZu2,
      },
    });
  });

  it("明刻は対面からポンした同じ牌 3 枚になる", () => {
    expect(exampleMinkou(HaiKind.Haku)).toEqual({
      type: MentsuType.Koutsu,
      hais: [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku],
      furo: { type: FuroType.Pon, from: Tacha.Toimen, nakiHai: HaiKind.Haku },
    });
  });

  it("暗刻は鳴きの無い同じ牌 3 枚になる", () => {
    expect(exampleAnkou(HaiKind.Haku)).toEqual({
      type: MentsuType.Koutsu,
      hais: [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku],
    });
  });

  it("明槓は対面から大明槓した同じ牌 4 枚になる", () => {
    expect(exampleMinkan(HaiKind.Chun)).toEqual({
      type: MentsuType.Kantsu,
      hais: [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun, HaiKind.Chun],
      furo: {
        type: FuroType.Daiminkan,
        from: Tacha.Toimen,
        nakiHai: HaiKind.Chun,
      },
    });
  });

  it("暗槓は鳴きの無い同じ牌 4 枚になる", () => {
    expect(exampleAnkan(HaiKind.Chun)).toEqual({
      type: MentsuType.Kantsu,
      hais: [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun, HaiKind.Chun],
    });
  });
});
