import { describe, it, expect } from "vitest";
import { HaiKind, MentsuType, type ScoreDetail, type HaiKindId, type Kazehai } from "@pai-forge/riichi-mahjong";
import { convertScoreDetailToFuDetails, type FuDetail } from "./fu-calculator";

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
  fourMentsu?: readonly any[];
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
      { type: MentsuType.Shuntsu, hais: [HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3] },
      { type: MentsuType.Shuntsu, hais: [HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3] },
      { type: MentsuType.Shuntsu, hais: [HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3] },
      { type: MentsuType.Shuntsu, hais: [HaiKind.ManZu4, HaiKind.ManZu5, HaiKind.ManZu6] },
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

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
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

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: false,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      expect(result).toEqual([{ reason: "副底", fu: 20 }]);
    });
  });

  describe("平和ツモ", () => {
    it("平和ツモは20符1行のみ返す", () => {
      const detail = makeMentsuDetail({ total: 20, base: 20, agari: 0 });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu4,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      expect(result).toEqual([{ reason: "平和ツモ", fu: 20 }]);
    });
  });

  describe("副底", () => {
    it("副底20符を含む", () => {
      const detail = makeMentsuDetail({ base: 20, agari: 10, total: 30 });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu4,
        isTsumo: false,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      expect(result[0]).toEqual({ reason: "副底", fu: 20 });
    });
  });

  describe("和了符", () => {
    it("ツモの場合「ツモ」と表示", () => {
      const detail = makeMentsuDetail({ agari: 2, total: 30 });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu4,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      const agariEntry = result.find((d) => d.reason === "ツモ");
      expect(agariEntry).toBeDefined();
      expect(agariEntry!.fu).toBe(2);
    });

    it("門前ロンの場合「門前加符」と表示", () => {
      const detail = makeMentsuDetail({ agari: 10, total: 30 });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu4,
        isTsumo: false,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      const agariEntry = result.find((d) => d.reason === "門前加符");
      expect(agariEntry).toBeDefined();
      expect(agariEntry!.fu).toBe(10);
    });

    it("和了符が0の場合は含まれない", () => {
      const detail = makeMentsuDetail({ agari: 0, total: 30 });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu4,
        isTsumo: false,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      expect(result.find((d) => d.reason === "門前加符")).toBeUndefined();
      expect(result.find((d) => d.reason === "ツモ")).toBeUndefined();
    });
  });

  describe("面子符", () => {
    it("中張牌の暗刻は4符", () => {
      const detail = makeMentsuDetail({
        mentsu: 4,
        total: 30,
        fourMentsu: [
          { type: MentsuType.Koutsu, hais: [HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.ManZu7, HaiKind.ManZu8, HaiKind.ManZu9] },
        ],
      });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.PinZu1,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("暗刻"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.fu).toBe(4);
      expect(mentsuEntry!.reason).toContain("中張牌");
    });

    it("么九牌の暗刻は8符", () => {
      const detail = makeMentsuDetail({
        mentsu: 8,
        total: 30,
        fourMentsu: [
          { type: MentsuType.Koutsu, hais: [HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.PinZu4, HaiKind.PinZu5, HaiKind.PinZu6] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.SouZu4, HaiKind.SouZu5, HaiKind.SouZu6] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.ManZu4, HaiKind.ManZu5, HaiKind.ManZu6] },
        ],
      });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.PinZu4,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("暗刻"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.fu).toBe(8);
      expect(mentsuEntry!.reason).toContain("么九牌");
    });

    it("中張牌の明刻は2符", () => {
      const detail = makeMentsuDetail({
        mentsu: 2,
        total: 30,
        fourMentsu: [
          { type: MentsuType.Koutsu, hais: [HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5], furo: { type: "Pon", from: "Kamicha" } },
          { type: MentsuType.Shuntsu, hais: [HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.ManZu7, HaiKind.ManZu8, HaiKind.ManZu9] },
        ],
      });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.PinZu1,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("明刻"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.fu).toBe(2);
    });

    it("么九牌の明刻は4符", () => {
      const detail = makeMentsuDetail({
        mentsu: 4,
        total: 30,
        fourMentsu: [
          { type: MentsuType.Koutsu, hais: [HaiKind.ManZu9, HaiKind.ManZu9, HaiKind.ManZu9], furo: { type: "Pon", from: "Kamicha" } },
          { type: MentsuType.Shuntsu, hais: [HaiKind.PinZu4, HaiKind.PinZu5, HaiKind.PinZu6] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.SouZu4, HaiKind.SouZu5, HaiKind.SouZu6] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.ManZu4, HaiKind.ManZu5, HaiKind.ManZu6] },
        ],
      });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.PinZu4,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("明刻"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.fu).toBe(4);
    });

    it("中張牌の暗槓は16符", () => {
      const detail = makeMentsuDetail({
        mentsu: 16,
        total: 40,
        fourMentsu: [
          { type: MentsuType.Kantsu, hais: [HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.ManZu7, HaiKind.ManZu8, HaiKind.ManZu9] },
        ],
      });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.PinZu1,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("暗槓子"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.fu).toBe(16);
    });

    it("么九牌の暗槓は32符", () => {
      const detail = makeMentsuDetail({
        mentsu: 32,
        total: 60,
        fourMentsu: [
          { type: MentsuType.Kantsu, hais: [HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.PinZu4, HaiKind.PinZu5, HaiKind.PinZu6] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.SouZu4, HaiKind.SouZu5, HaiKind.SouZu6] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.ManZu4, HaiKind.ManZu5, HaiKind.ManZu6] },
        ],
      });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.PinZu4,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("暗槓子"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.fu).toBe(32);
    });

    it("中張牌の明槓は8符", () => {
      const detail = makeMentsuDetail({
        mentsu: 8,
        total: 30,
        fourMentsu: [
          { type: MentsuType.Kantsu, hais: [HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5], furo: { type: "Daiminkan", from: "Kamicha" } },
          { type: MentsuType.Shuntsu, hais: [HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.ManZu7, HaiKind.ManZu8, HaiKind.ManZu9] },
        ],
      });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.PinZu1,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("明槓子"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.fu).toBe(8);
    });

    it("么九牌の明槓は16符", () => {
      const detail = makeMentsuDetail({
        mentsu: 16,
        total: 40,
        fourMentsu: [
          { type: MentsuType.Kantsu, hais: [HaiKind.Ton, HaiKind.Ton, HaiKind.Ton, HaiKind.Ton], furo: { type: "Daiminkan", from: "Kamicha" } },
          { type: MentsuType.Shuntsu, hais: [HaiKind.PinZu4, HaiKind.PinZu5, HaiKind.PinZu6] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.SouZu4, HaiKind.SouZu5, HaiKind.SouZu6] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.ManZu4, HaiKind.ManZu5, HaiKind.ManZu6] },
        ],
      });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.PinZu4,
        isTsumo: true,
        bakaze: HaiKind.Nan,
        jikaze: HaiKind.Sha,
      });

      const mentsuEntry = result.find((d) => d.reason.includes("明槓子"));
      expect(mentsuEntry).toBeDefined();
      expect(mentsuEntry!.fu).toBe(16);
    });

    it("ロン和了で刻子に和了牌が含まれる場合は明刻扱い", () => {
      const detail = makeMentsuDetail({
        mentsu: 2,
        total: 30,
        fourMentsu: [
          { type: MentsuType.Koutsu, hais: [HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3] },
          { type: MentsuType.Shuntsu, hais: [HaiKind.ManZu7, HaiKind.ManZu8, HaiKind.ManZu9] },
        ],
      });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu5, // 和了牌が刻子に含まれる → シャンポン待ち → 明刻
        isTsumo: false,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
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

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
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

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
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

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
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

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Ton,
      });

      const jantouEntry = result.find((d) => d.reason.includes("雀頭"));
      expect(jantouEntry).toBeDefined();
      expect(jantouEntry!.reason).toContain("場風");
      expect(jantouEntry!.reason).toContain("自風");
    });

    it("雀頭符が0の場合は含まれない", () => {
      const detail = makeMentsuDetail({ jantou: 0, total: 30 });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      expect(result.find((d) => d.reason.includes("雀頭"))).toBeUndefined();
    });
  });

  describe("待ち符", () => {
    it("単騎待ちは2符", () => {
      const detail = makeMentsuDetail({ machi: 2, total: 30, machiType: "Tanki" });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      const machiEntry = result.find((d) => d.reason.includes("待ち"));
      expect(machiEntry).toBeDefined();
      expect(machiEntry!.reason).toBe("単騎待ち");
      expect(machiEntry!.fu).toBe(2);
    });

    it("嵌張待ちは2符", () => {
      const detail = makeMentsuDetail({ machi: 2, total: 30, machiType: "Kanchan" });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu2,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      const machiEntry = result.find((d) => d.reason.includes("待ち"));
      expect(machiEntry).toBeDefined();
      expect(machiEntry!.reason).toBe("嵌張待ち");
    });

    it("辺張待ちは2符", () => {
      const detail = makeMentsuDetail({ machi: 2, total: 30, machiType: "Penchan" });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu3,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      const machiEntry = result.find((d) => d.reason.includes("待ち"));
      expect(machiEntry).toBeDefined();
      expect(machiEntry!.reason).toBe("辺張待ち");
    });

    it("待ち符が0の場合は含まれない", () => {
      const detail = makeMentsuDetail({ machi: 0, total: 30 });

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu1,
        isTsumo: true,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
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

      const result = convertScoreDetailToFuDetails(detail, {
        agariHai: HaiKind.ManZu4,
        isTsumo: false,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      const tokureiEntry = result.find((d) => d.reason === "特例等の加符");
      expect(tokureiEntry).toBeDefined();
      expect(tokureiEntry!.fu).toBe(10);
    });
  });
});
