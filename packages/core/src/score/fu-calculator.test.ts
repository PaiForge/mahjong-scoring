import { describe, it, expect } from "vitest";
import {
  HaiKind,
  MentsuType,
  type ScoreDetail,
  type HaiKindId,
  type Kazehai,
} from "@pai-forge/riichi-mahjong";
import { convertScoreDetailToFuDetails, type FuDetail } from "./fu-calculator";

/**
 * テスト用の面子
 *
 * ScoreDetail の面子はライブラリ型より緩い形で足りるため、
 * 検証に必要なフィールドだけを持つ。
 */
interface TestMentsu {
  readonly type: MentsuType;
  readonly hais: readonly HaiKindId[];
  readonly furo?: { readonly type: unknown; readonly from: unknown };
}

/**
 * テスト用の ScoreDetail を構築するヘルパー
 */
function makeMentsuDetail(overrides: {
  base?: 20 | 25;
  mentsu?: number;
  jantou?: number;
  machi?: number;
  agari?: number;
  total?: number;
  fourMentsu?: readonly TestMentsu[];
  jantouHais?: readonly HaiKindId[];
  machiType?: string;
}): ScoreDetail {
  const {
    base = 20,
    mentsu = 0,
    jantou = 0,
    machi = 0,
    agari = 0,
    total = 30,
    fourMentsu = [
      {
        type: MentsuType.Shuntsu,
        hais: [HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3],
      },
      {
        type: MentsuType.Shuntsu,
        hais: [HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3],
      },
      {
        type: MentsuType.Shuntsu,
        hais: [HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3],
      },
      {
        type: MentsuType.Shuntsu,
        hais: [HaiKind.ManZu4, HaiKind.ManZu5, HaiKind.ManZu6],
      },
    ],
    jantouHais = [HaiKind.ManZu9, HaiKind.ManZu9],
    machiType = "Ryanmen",
  } = overrides;

  return {
    structure: {
      type: "Mentsu",
      fourMentsu,
      jantou: { type: MentsuType.Toitsu, hais: jantouHais },
    },
    machiType,
    fuResult: {
      total,
      details: { base, mentsu, jantou, machi, agari },
    },
  } as unknown as ScoreDetail;
}

/**
 * 検証対象の面子に添える、符に影響しない3面子
 *
 * 順子は0符なので、面子符の検証では対象の1面子だけが結果に現れる。対象と牌が
 * 重ならないよう2組用意する。中張牌（5）を検証するときは `CHUNCHAN_FILLER` と
 * 和了牌 `PinZu1`、么九牌（1・9・字牌）を検証するときは `YAOCHU_FILLER` と
 * 和了牌 `PinZu4` を使う。和了牌はフィラー側の牌を指すことで、対象の刻子が
 * ロンでシャンポン待ち扱いになるのを避ける。
 */
const CHUNCHAN_FILLER: readonly TestMentsu[] = [
  {
    type: MentsuType.Shuntsu,
    hais: [HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3],
  },
  {
    type: MentsuType.Shuntsu,
    hais: [HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3],
  },
  {
    type: MentsuType.Shuntsu,
    hais: [HaiKind.ManZu7, HaiKind.ManZu8, HaiKind.ManZu9],
  },
];

/** {@link CHUNCHAN_FILLER} の么九牌版 */
const YAOCHU_FILLER: readonly TestMentsu[] = [
  {
    type: MentsuType.Shuntsu,
    hais: [HaiKind.PinZu4, HaiKind.PinZu5, HaiKind.PinZu6],
  },
  {
    type: MentsuType.Shuntsu,
    hais: [HaiKind.SouZu4, HaiKind.SouZu5, HaiKind.SouZu6],
  },
  {
    type: MentsuType.Shuntsu,
    hais: [HaiKind.ManZu4, HaiKind.ManZu5, HaiKind.ManZu6],
  },
];

/**
 * 「検証対象の面子ひとつ + 符に影響しない3面子」の ScoreDetail を組むヘルパー
 */
function makeTargetMentsuDetail(
  target: TestMentsu,
  filler: readonly TestMentsu[],
  fu: { readonly mentsu: number; readonly total: number },
): ScoreDetail {
  return makeMentsuDetail({ ...fu, fourMentsu: [target, ...filler] });
}

/**
 * 既定の場風・自風で符の内訳を求める
 *
 * ほとんどのケースは風が結果に影響しない（面子符・待ち符の検証）ため、
 * 東場・南家を既定にする。風そのものを検証するテストだけが上書きする。
 */
function convert(
  detail: ScoreDetail,
  context: {
    agariHai: HaiKindId;
    isTsumo: boolean;
    bakaze?: Kazehai;
    jikaze?: Kazehai;
  },
): readonly FuDetail[] {
  return convertScoreDetailToFuDetails(detail, {
    bakaze: HaiKind.Ton,
    jikaze: HaiKind.Nan,
    ...context,
  });
}

describe("convertScoreDetailToFuDetails", () => {
  describe("七対子", () => {
    it("七対子は25符1行のみ返す", () => {
      const detail: ScoreDetail = {
        structure: { type: "Chiitoitsu", pairs: [] },
        machiType: undefined,
        fuResult: {
          total: 25,
          details: { base: 25, mentsu: 0, jantou: 0, machi: 0, agari: 0 },
        },
      } as unknown as ScoreDetail;

      const result = convert(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: true,
      });

      expect(result).toEqual([{ reason: "七対子", fu: 25 }]);
    });
  });

  describe("国士無双", () => {
    it("国士無双は副底20符のみ返す", () => {
      const detail: ScoreDetail = {
        structure: { type: "Kokushi" },
        machiType: undefined,
        fuResult: {
          total: 20,
          details: { base: 20, mentsu: 0, jantou: 0, machi: 0, agari: 0 },
        },
      } as unknown as ScoreDetail;

      const result = convert(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: false,
      });

      expect(result).toEqual([{ reason: "副底", fu: 20 }]);
    });
  });

  describe("平和ツモ", () => {
    it("平和ツモは20符1行のみ返す", () => {
      const detail = makeMentsuDetail({ total: 20, base: 20, agari: 0 });

      const result = convert(detail, {
        agariHai: HaiKind.ManZu4,
        isTsumo: true,
      });

      expect(result).toEqual([{ reason: "平和ツモ", fu: 20 }]);
    });
  });

  describe("副底", () => {
    it("副底20符を含む", () => {
      const detail = makeMentsuDetail({ base: 20, agari: 10, total: 30 });

      const result = convert(detail, {
        agariHai: HaiKind.ManZu4,
        isTsumo: false,
      });

      expect(result[0]).toEqual({ reason: "副底", fu: 20 });
    });
  });

  describe("和了符", () => {
    it("ツモの場合「ツモ」と表示", () => {
      const detail = makeMentsuDetail({ agari: 2, total: 30 });

      const result = convert(detail, {
        agariHai: HaiKind.ManZu4,
        isTsumo: true,
      });

      const agariEntry = result.find((d) => d.reason === "ツモ");
      expect(agariEntry).toBeDefined();
      expect(agariEntry!.fu).toBe(2);
    });

    it("門前ロンの場合「門前加符」と表示", () => {
      const detail = makeMentsuDetail({ agari: 10, total: 30 });

      const result = convert(detail, {
        agariHai: HaiKind.ManZu4,
        isTsumo: false,
      });

      const agariEntry = result.find((d) => d.reason === "門前加符");
      expect(agariEntry).toBeDefined();
      expect(agariEntry!.fu).toBe(10);
    });

    it("和了符が0の場合は含まれない", () => {
      const detail = makeMentsuDetail({ agari: 0, total: 30 });

      const result = convert(detail, {
        agariHai: HaiKind.ManZu4,
        isTsumo: false,
      });

      expect(result.find((d) => d.reason === "門前加符")).toBeUndefined();
      expect(result.find((d) => d.reason === "ツモ")).toBeUndefined();
    });
  });

  describe("面子符", () => {
    it("中張牌の暗刻は4符", () => {
      const detail = makeTargetMentsuDetail(
        {
          type: MentsuType.Koutsu,
          hais: [HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5],
        },
        CHUNCHAN_FILLER,
        { mentsu: 4, total: 30 },
      );

      const result = convert(detail, {
        agariHai: HaiKind.PinZu1,
        isTsumo: true,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("暗刻"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.fu).toBe(4);
      expect(mentsuEntry!.reason).toContain("中張牌");
    });

    it("么九牌の暗刻は8符", () => {
      const detail = makeTargetMentsuDetail(
        {
          type: MentsuType.Koutsu,
          hais: [HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1],
        },
        YAOCHU_FILLER,
        { mentsu: 8, total: 30 },
      );

      const result = convert(detail, {
        agariHai: HaiKind.PinZu4,
        isTsumo: true,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("暗刻"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.fu).toBe(8);
      expect(mentsuEntry!.reason).toContain("么九牌");
    });

    it("中張牌の明刻は2符", () => {
      const detail = makeTargetMentsuDetail(
        {
          type: MentsuType.Koutsu,
          hais: [HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5],
          furo: { type: "Pon", from: "Kamicha" },
        },
        CHUNCHAN_FILLER,
        { mentsu: 2, total: 30 },
      );

      const result = convert(detail, {
        agariHai: HaiKind.PinZu1,
        isTsumo: true,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("明刻"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.fu).toBe(2);
    });

    it("么九牌の明刻は4符", () => {
      const detail = makeTargetMentsuDetail(
        {
          type: MentsuType.Koutsu,
          hais: [HaiKind.ManZu9, HaiKind.ManZu9, HaiKind.ManZu9],
          furo: { type: "Pon", from: "Kamicha" },
        },
        YAOCHU_FILLER,
        { mentsu: 4, total: 30 },
      );

      const result = convert(detail, {
        agariHai: HaiKind.PinZu4,
        isTsumo: true,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("明刻"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.fu).toBe(4);
    });

    it("中張牌の暗槓は16符", () => {
      const detail = makeTargetMentsuDetail(
        {
          type: MentsuType.Kantsu,
          hais: [
            HaiKind.ManZu5,
            HaiKind.ManZu5,
            HaiKind.ManZu5,
            HaiKind.ManZu5,
          ],
        },
        CHUNCHAN_FILLER,
        { mentsu: 16, total: 40 },
      );

      const result = convert(detail, {
        agariHai: HaiKind.PinZu1,
        isTsumo: true,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("暗槓子"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.fu).toBe(16);
    });

    it("么九牌の暗槓は32符", () => {
      const detail = makeTargetMentsuDetail(
        {
          type: MentsuType.Kantsu,
          hais: [
            HaiKind.ManZu1,
            HaiKind.ManZu1,
            HaiKind.ManZu1,
            HaiKind.ManZu1,
          ],
        },
        YAOCHU_FILLER,
        { mentsu: 32, total: 60 },
      );

      const result = convert(detail, {
        agariHai: HaiKind.PinZu4,
        isTsumo: true,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("暗槓子"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.fu).toBe(32);
    });

    it("中張牌の明槓は8符", () => {
      const detail = makeTargetMentsuDetail(
        {
          type: MentsuType.Kantsu,
          hais: [
            HaiKind.ManZu5,
            HaiKind.ManZu5,
            HaiKind.ManZu5,
            HaiKind.ManZu5,
          ],
          furo: { type: "Daiminkan", from: "Kamicha" },
        },
        CHUNCHAN_FILLER,
        { mentsu: 8, total: 30 },
      );

      const result = convert(detail, {
        agariHai: HaiKind.PinZu1,
        isTsumo: true,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("明槓子"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.fu).toBe(8);
    });

    it("么九牌の明槓は16符", () => {
      const detail = makeTargetMentsuDetail(
        {
          type: MentsuType.Kantsu,
          hais: [HaiKind.Ton, HaiKind.Ton, HaiKind.Ton, HaiKind.Ton],
          furo: { type: "Daiminkan", from: "Kamicha" },
        },
        YAOCHU_FILLER,
        { mentsu: 16, total: 40 },
      );

      const result = convert(detail, {
        agariHai: HaiKind.PinZu4,
        isTsumo: true,
        // 場風・自風のどちらでもない雀頭であることを検証する
        bakaze: HaiKind.Nan,
        jikaze: HaiKind.Sha,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("明槓子"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.fu).toBe(16);
    });

    it("ロン和了で刻子に和了牌が含まれる場合は明刻扱い", () => {
      const detail = makeTargetMentsuDetail(
        {
          type: MentsuType.Koutsu,
          hais: [HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5],
        },
        CHUNCHAN_FILLER,
        { mentsu: 2, total: 30 },
      );

      const result = convert(detail, {
        agariHai: HaiKind.ManZu5, // 和了牌が刻子に含まれる → シャンポン待ち → 明刻
        isTsumo: false,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("刻"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.reason).toContain("明刻");
      expect(mentsuEntry!.fu).toBe(2);
    });
  });

  describe("雀頭符", () => {
    it("場風牌の雀頭で2符", () => {
      const detail = makeMentsuDetail({
        jantou: 2,
        total: 30,
        jantouHais: [HaiKind.Ton, HaiKind.Ton],
      });

      const result = convert(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: true,
      });

      const jantouEntry = result.find((d) => d.reason.includes("雀頭"));
      expect(jantouEntry).toBeDefined();
      expect(jantouEntry!.fu).toBe(2);
      expect(jantouEntry!.reason).toContain("場風");
    });

    it("自風牌の雀頭で2符", () => {
      const detail = makeMentsuDetail({
        jantou: 2,
        total: 30,
        jantouHais: [HaiKind.Nan, HaiKind.Nan],
      });

      const result = convert(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: true,
      });

      const jantouEntry = result.find((d) => d.reason.includes("雀頭"));
      expect(jantouEntry).toBeDefined();
      expect(jantouEntry!.reason).toContain("自風");
    });

    it("三元牌の雀頭で2符", () => {
      const detail = makeMentsuDetail({
        jantou: 2,
        total: 30,
        jantouHais: [HaiKind.Haku, HaiKind.Haku],
      });

      const result = convert(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: true,
      });

      const jantouEntry = result.find((d) => d.reason.includes("雀頭"));
      expect(jantouEntry).toBeDefined();
      expect(jantouEntry!.reason).toContain("三元牌");
    });

    it("連風牌の雀頭で場風・自風の両方が表示される", () => {
      const detail = makeMentsuDetail({
        jantou: 4,
        total: 30,
        jantouHais: [HaiKind.Ton, HaiKind.Ton],
      });

      const result = convert(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: true,
        // 連風牌（場風＝自風）の雀頭を検証する
        jikaze: HaiKind.Ton,
      });

      const jantouEntry = result.find((d) => d.reason.includes("雀頭"));
      expect(jantouEntry).toBeDefined();
      expect(jantouEntry!.reason).toContain("場風");
      expect(jantouEntry!.reason).toContain("自風");
    });

    it("雀頭符が0の場合は含まれない", () => {
      const detail = makeMentsuDetail({ jantou: 0, total: 30 });

      const result = convert(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: true,
      });

      expect(result.find((d) => d.reason.includes("雀頭"))).toBeUndefined();
    });
  });

  describe("待ち符", () => {
    it("単騎待ちは2符", () => {
      const detail = makeMentsuDetail({
        machi: 2,
        total: 30,
        machiType: "Tanki",
      });

      const result = convert(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: true,
      });

      const machiEntry = result.find((d) => d.reason.includes("待ち"));
      expect(machiEntry).toBeDefined();
      expect(machiEntry!.reason).toBe("単騎待ち");
      expect(machiEntry!.fu).toBe(2);
    });

    it("嵌張待ちは2符", () => {
      const detail = makeMentsuDetail({
        machi: 2,
        total: 30,
        machiType: "Kanchan",
      });

      const result = convert(detail, {
        agariHai: HaiKind.ManZu2,
        isTsumo: true,
      });

      const machiEntry = result.find((d) => d.reason.includes("待ち"));
      expect(machiEntry).toBeDefined();
      expect(machiEntry!.reason).toBe("嵌張待ち");
    });

    it("辺張待ちは2符", () => {
      const detail = makeMentsuDetail({
        machi: 2,
        total: 30,
        machiType: "Penchan",
      });

      const result = convert(detail, {
        agariHai: HaiKind.ManZu3,
        isTsumo: true,
      });

      const machiEntry = result.find((d) => d.reason.includes("待ち"));
      expect(machiEntry).toBeDefined();
      expect(machiEntry!.reason).toBe("辺張待ち");
    });

    it("待ち符が0の場合は含まれない", () => {
      const detail = makeMentsuDetail({ machi: 0, total: 30 });

      const result = convert(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: true,
      });

      expect(result.find((d) => d.reason.includes("待ち"))).toBeUndefined();
    });
  });

  describe("喰い平和の特例", () => {
    it("ロンで合計20符の場合、特例加符10符が追加される", () => {
      const detail = makeMentsuDetail({
        base: 20,
        mentsu: 0,
        jantou: 0,
        machi: 0,
        agari: 0,
        total: 30,
      });

      const result = convert(detail, {
        agariHai: HaiKind.ManZu4,
        isTsumo: false,
      });

      const tokureiEntry = result.find((d) => d.reason === "特例等の加符");
      expect(tokureiEntry).toBeDefined();
      expect(tokureiEntry!.fu).toBe(10);
    });
  });
});
