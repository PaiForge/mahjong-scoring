import { describe, expect, it } from "vitest";

import {
  FuroType,
  HaiKind,
  MentsuType,
  Tacha,
  calculateJantouFu,
  calculateMachiFu,
  calculateStandaloneMentsuFu,
  type CompletedMentsu,
  type HaiKindId,
  type MachiType,
} from "@mahjong-scoring/core";
import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import {
  JANTOU_FU_SUMMARY_ROWS,
  MACHI_FU_SUMMARY_ROWS,
  MENTSU_FU_SUMMARY_ROWS,
  type FuSummaryRow,
} from "./fu-summary-rows";

// 早見表の符の値は、表の行が言い表す牌・面子・待ちの代表を core で計算した
// 結果と突き合わせる（値を写して比べると、写し間違いも一緒に通ってしまう）。

const BAKAZE = HaiKind.Ton;
const JIKAZE = HaiKind.Nan;

/** 早見表の行の代表として計算する雀頭の牌（東場・南家） */
const JANTOU_ROW_TILES: Readonly<
  Record<(typeof JANTOU_FU_SUMMARY_ROWS)[number]["key"], readonly HaiKindId[]>
> = {
  rowSangen: [HaiKind.Haku, HaiKind.Hatsu, HaiKind.Chun],
  rowBakaze: [BAKAZE],
  rowJikaze: [JIKAZE],
  rowOther: [HaiKind.Sha, HaiKind.Pei, HaiKind.ManZu1, HaiKind.PinZu5],
};

function koutsu(hai: HaiKindId, open: boolean): CompletedMentsu {
  return open
    ? {
        type: MentsuType.Koutsu,
        hais: [hai, hai, hai],
        furo: { type: FuroType.Pon, from: Tacha.Toimen, nakiHai: hai },
      }
    : { type: MentsuType.Koutsu, hais: [hai, hai, hai] };
}

function kantsu(hai: HaiKindId, open: boolean): CompletedMentsu {
  return open
    ? {
        type: MentsuType.Kantsu,
        hais: [hai, hai, hai, hai],
        furo: { type: FuroType.Daiminkan, from: Tacha.Toimen, nakiHai: hai },
      }
    : { type: MentsuType.Kantsu, hais: [hai, hai, hai, hai] };
}

const SIMPLE = HaiKind.ManZu5;
const YAOCHU = HaiKind.Chun;

/** 早見表の行の代表として計算する面子（行の名前が「A または B」なら両方） */
const MENTSU_ROW_MENTSU: Readonly<
  Record<
    (typeof MENTSU_FU_SUMMARY_ROWS)[number]["key"],
    readonly CompletedMentsu[]
  >
> = {
  rowShuntsu: [
    {
      type: MentsuType.Shuntsu,
      hais: [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4],
    },
  ],
  rowOpenSimpleKoutsu: [koutsu(SIMPLE, true)],
  rowClosedSimpleKoutsuOrOpenYaochuKoutsu: [
    koutsu(SIMPLE, false),
    koutsu(YAOCHU, true),
  ],
  rowClosedYaochuKoutsuOrOpenSimpleKantsu: [
    koutsu(YAOCHU, false),
    kantsu(SIMPLE, true),
  ],
  rowClosedSimpleKantsuOrOpenYaochuKantsu: [
    kantsu(SIMPLE, false),
    kantsu(YAOCHU, true),
  ],
  rowClosedYaochuKantsu: [kantsu(YAOCHU, false)],
};

/** 待ちの早見表の行が言い表す待ちの形（キーは `row<待ちの形>`） */
const MACHI_ROW_TYPES: Readonly<
  Record<(typeof MACHI_FU_SUMMARY_ROWS)[number]["key"], MachiType>
> = {
  rowKanchan: "Kanchan",
  rowPenchan: "Penchan",
  rowTanki: "Tanki",
  rowRyanmen: "Ryanmen",
  rowShanpon: "Shanpon",
};

/** 辞書の名前空間の下のキーを引く（無ければ undefined） */
function lookup(namespace: unknown, key: string): unknown {
  if (typeof namespace !== "object" || namespace === null) return undefined;
  return (namespace as Readonly<Record<string, unknown>>)[key];
}

const TABLES: readonly {
  readonly name: string;
  readonly rows: readonly FuSummaryRow[];
  readonly ja: unknown;
  readonly en: unknown;
}[] = [
  {
    name: "雀頭",
    rows: JANTOU_FU_SUMMARY_ROWS,
    ja: jaMessages.jantouFu.learn,
    en: enMessages.jantouFu.learn,
  },
  {
    name: "面子",
    rows: MENTSU_FU_SUMMARY_ROWS,
    ja: jaMessages.mentsuFu.learn,
    en: enMessages.mentsuFu.learn,
  },
  {
    name: "待ち",
    rows: MACHI_FU_SUMMARY_ROWS,
    ja: jaMessages.machiFu.learn,
    en: enMessages.machiFu.learn,
  },
];

describe("符の早見表", () => {
  it.each(TABLES)(
    "$name: 行のキーは重複せず、日本語・英語の辞書に行の文言がある",
    ({ rows, ja, en }) => {
      const keys = rows.map((row) => row.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const key of keys) {
        expect(typeof lookup(ja, key), key).toBe("string");
        expect(typeof lookup(en, key), key).toBe("string");
      }
    },
  );

  it("雀頭: 各行の符は、その行の牌を東場・南家の雀頭にしたときの符と一致する", () => {
    for (const row of JANTOU_FU_SUMMARY_ROWS) {
      for (const tile of JANTOU_ROW_TILES[row.key]) {
        expect(calculateJantouFu(tile, BAKAZE, JIKAZE), row.key).toBe(row.fu);
      }
    }
  });

  it("面子: 各行の符は、その行が言い表す面子の符と一致する", () => {
    for (const row of MENTSU_FU_SUMMARY_ROWS) {
      for (const mentsu of MENTSU_ROW_MENTSU[row.key]) {
        expect(calculateStandaloneMentsuFu(mentsu), row.key).toBe(row.fu);
      }
    }
  });

  it("待ち: 各行の符は、その行の待ちの形の符と一致する", () => {
    for (const row of MACHI_FU_SUMMARY_ROWS) {
      expect(calculateMachiFu(MACHI_ROW_TYPES[row.key]), row.key).toBe(row.fu);
    }
  });
});
