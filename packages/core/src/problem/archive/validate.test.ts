import { describe, expect, it } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";
import {
  agariRequest,
  ankanRiichiAgariQuestion,
  meldedAgariQuestion,
  noYakuRonTenpaiQuestion,
  overTheWire,
} from "./test-fixtures";
import type {
  AgariProblemPayload,
  PracticeProblemArchiveRequest,
  TenpaiProblemPayload,
} from "./types";
import { rebuildAgariQuestion } from "./rebuild";
import { parsePracticeProblemArchiveRequest } from "./validate";

const parse = parsePracticeProblemArchiveRequest;

/** 和了形の要求（純手牌だけ。表ドラ表示牌は北 1 枚・リーチなし・南家の東場） */
function agari(
  overrides: Partial<AgariProblemPayload> & { closed?: number[] },
): unknown {
  const { closed, ...rest } = overrides;
  const payload: AgariProblemPayload = {
    hand: { closed: closed ?? [], exposed: [] },
    agariHai: HaiKind.ManZu1,
    isTsumo: true,
    jikaze: HaiKind.Nan,
    bakaze: HaiKind.Ton,
    doraMarkers: [HaiKind.Pei],
    riichi: null,
    ...rest,
  };
  return { kind: "agari-score", schemaVersion: 1, payload };
}

/** 聴牌形の要求（純手牌だけ。表ドラ表示牌は北 1 枚・リーチなし・南家の東場） */
function tenpai(
  closed: number[],
  overrides: Partial<TenpaiProblemPayload> = {},
): unknown {
  const payload: TenpaiProblemPayload = {
    hand: { closed, exposed: [] },
    jikaze: HaiKind.Nan,
    bakaze: HaiKind.Ton,
    doraMarkers: [HaiKind.Pei],
    riichi: null,
    ...overrides,
  };
  return { kind: "tenpai-score", schemaVersion: 1, payload };
}

/** 牌の列を MPSZ 風に書くための略記（萬子 1〜9 → 0〜8 など） */
const m = (n: number) => n - 1;
const p = (n: number) => 8 + n;
const s = (n: number) => 17 + n;
const z = (n: number) => 26 + n;

/** 123m 456p 789s 234s 55z。単騎は無く、和了牌 1m の和了形（ツモ・白の雀頭） */
const PLAIN_AGARI = [
  m(1),
  m(2),
  m(3),
  p(4),
  p(5),
  p(6),
  s(2),
  s(3),
  s(4),
  s(7),
  s(8),
  s(9),
  z(5),
  z(5),
];

function errorOf(input: unknown) {
  return parse(input)._unsafeUnwrapErr();
}

describe("parsePracticeProblemArchiveRequest: 形", () => {
  it("出題した和了形の要求は受け付ける", () => {
    expect(parse(agari({ closed: PLAIN_AGARI })).isOk()).toBe(true);
  });

  it("未知のキーは最上位・盤面・手牌・副露のどこにあっても拒む", () => {
    const request = agariRequest(meldedAgariQuestion());
    expect(errorOf({ ...request, extra: 1 })).toBe("malformed");
    if (request.kind !== "agari-score") throw new Error(request.kind);
    const { payload } = request;
    expect(
      errorOf({ ...request, payload: { ...payload, ruleConfig: {} } }),
    ).toBe("malformed");
    expect(
      errorOf({
        ...request,
        payload: { ...payload, hand: { ...payload.hand, waits: [] } },
      }),
    ).toBe("malformed");
    const [chi, ...others] = payload.hand.exposed;
    expect(
      errorOf({
        ...request,
        payload: {
          ...payload,
          hand: {
            ...payload.hand,
            exposed: [{ ...chi, from: "kamicha" }, ...others],
          },
        },
      }),
    ).toBe("malformed");
  });

  it("キーの欠けた要求は拒む", () => {
    expect(errorOf({ kind: "agari-score", schemaVersion: 1 })).toBe(
      "malformed",
    );
    const request = agariRequest(ankanRiichiAgariQuestion());
    const { riichi: _riichi, ...withoutRiichi } = request.payload;
    expect(errorOf({ ...request, payload: withoutRiichi })).toBe("malformed");
  });

  it("未知の種別・未知の版は拒む", () => {
    const request = agariRequest(meldedAgariQuestion());
    expect(errorOf({ ...request, kind: "machi-fu" })).toBe("unknownKind");
    expect(errorOf({ ...request, schemaVersion: 2 })).toBe(
      "unsupportedSchemaVersion",
    );
  });

  it("牌種 ID の範囲外・整数でない値・風でない風は拒む", () => {
    expect(errorOf(agari({ closed: [...PLAIN_AGARI.slice(1), 34] }))).toBe(
      "malformed",
    );
    expect(errorOf(agari({ closed: [...PLAIN_AGARI.slice(1), 0.5] }))).toBe(
      "malformed",
    );
    expect(errorOf(agari({ closed: PLAIN_AGARI, jikaze: z(5) }))).toBe(
      "malformed",
    );
  });

  it("配列が長すぎる要求は採点の前に拒む", () => {
    const tooLong = [...PLAIN_AGARI, m(9)];
    expect(errorOf(agari({ closed: tooLong }))).toBe("malformed");
    expect(
      errorOf(
        agari({
          closed: PLAIN_AGARI,
          doraMarkers: [z(4), z(4), z(4), z(3), z(3), z(3)],
        }),
      ),
    ).toBe("malformed");
  });
});

describe("parsePracticeProblemArchiveRequest: 手牌", () => {
  it("純手牌の並びが理牌の順でなければ並べ直して受け付ける", () => {
    const shuffled = [...PLAIN_AGARI].reverse();
    const accepted = parse(agari({ closed: shuffled }))._unsafeUnwrap();
    expect(accepted.payload.hand.closed).toEqual(PLAIN_AGARI);
  });

  it("連番でないチー・同種でないポンは拒む", () => {
    const request = agariRequest(meldedAgariQuestion());
    if (request.kind !== "agari-score") throw new Error(request.kind);
    const { payload } = request;
    const [, pon, ...rest] = payload.hand.exposed;
    const withMeld = (meld: unknown, at: 0 | 1): unknown => ({
      ...request,
      payload: {
        ...payload,
        hand: {
          ...payload.hand,
          exposed:
            at === 0
              ? [meld, pon, ...rest]
              : [payload.hand.exposed[0], meld, ...rest],
        },
      },
    });
    expect(
      errorOf(withMeld({ type: "chi", hais: [1, 3, 4], nakiHai: 1 }, 0)),
    ).toBe("invalidMeld");
    // 9m・1p・2p は数値では連番だが色を跨ぐ
    expect(
      errorOf(withMeld({ type: "chi", hais: [8, 9, 10], nakiHai: 9 }, 0)),
    ).toBe("invalidMeld");
    expect(
      errorOf(withMeld({ type: "chi", hais: [1, 2, 3], nakiHai: 5 }, 0)),
    ).toBe("invalidMeld");
    expect(
      errorOf(withMeld({ type: "pon", hais: [31, 31, 32], from: "toimen" }, 1)),
    ).toBe("invalidMeld");
  });

  it("枚数が和了形 14 枚相当でない手は拒む", () => {
    expect(errorOf(agari({ closed: PLAIN_AGARI.slice(1) }))).toBe(
      "invalidHaiCount",
    );
  });

  it("手牌の中だけで同種 5 枚目がある手は拒む", () => {
    const fiveOfOne = [
      m(1),
      m(1),
      m(1),
      m(1),
      m(1),
      p(4),
      p(5),
      p(6),
      s(2),
      s(3),
      s(4),
      z(5),
      z(5),
      z(5),
    ];
    expect(errorOf(agari({ closed: fiveOfOne }))).toBe("invalidHand");
  });
});

describe("parsePracticeProblemArchiveRequest: 表示牌とリーチ", () => {
  it("表示牌に取られた分を含めて同種 5 枚目になる盤面は拒む", () => {
    const request = agariRequest(ankanRiichiAgariQuestion());
    if (request.kind !== "agari-score") throw new Error(request.kind);
    const { payload } = request;
    // 暗槓の 2p 4 枚 + 表ドラ表示牌の 2p
    expect(
      errorOf({
        ...request,
        payload: { ...payload, doraMarkers: [p(2), m(1)] },
      }),
    ).toBe("tooManyCopies");
    // 暗槓の 2p 4 枚 + 裏ドラ表示牌の 2p
    expect(
      errorOf({
        ...request,
        payload: { ...payload, riichi: { uraDoraMarkers: [p(2), m(1)] } },
      }),
    ).toBe("tooManyCopies");
  });

  it("表ドラ表示牌が 1 + 槓子の数でない盤面は拒む", () => {
    expect(
      errorOf(agari({ closed: PLAIN_AGARI, doraMarkers: [z(4), z(3)] })),
    ).toBe("invalidDoraMarkerCount");
    expect(errorOf(agari({ closed: PLAIN_AGARI, doraMarkers: [] }))).toBe(
      "invalidDoraMarkerCount",
    );
  });

  it("裏ドラ表示牌の無いリーチ・枚数の違うリーチは拒む", () => {
    expect(
      errorOf(agari({ closed: PLAIN_AGARI, riichi: { uraDoraMarkers: [] } })),
    ).toBe("invalidUraDoraMarkerCount");
    expect(
      errorOf(
        agari({
          closed: PLAIN_AGARI,
          riichi: { uraDoraMarkers: [z(4), z(3)] },
        }),
      ),
    ).toBe("invalidUraDoraMarkerCount");
  });

  it("暗槓以外の副露を持つ手のリーチは拒む", () => {
    const request = agariRequest(meldedAgariQuestion());
    if (request.kind !== "agari-score") throw new Error(request.kind);
    expect(
      errorOf({
        ...request,
        payload: {
          ...request.payload,
          riichi: { uraDoraMarkers: [z(1), z(2), z(3)] },
        },
      }),
    ).toBe("riichiWithFuro");
  });

  it("暗槓だけを持つ門前の手のリーチは受け付ける", () => {
    const request = overTheWire(agariRequest(ankanRiichiAgariQuestion()));
    expect(parse(request).isOk()).toBe(true);
  });
});

describe("parsePracticeProblemArchiveRequest: 和了形の採点", () => {
  it("和了牌が純手牌に無い盤面は拒む", () => {
    expect(
      errorOf(agari({ closed: PLAIN_AGARI, agariHai: HaiKind.ManZu9 })),
    ).toBe("agariHaiNotInHand");
  });

  it("役の無い和了形は拒む", () => {
    // 222m 456p 789p 333s 99s を 3s でロン（双碰の明刻。役なし）
    const noYaku = [
      m(2),
      m(2),
      m(2),
      p(4),
      p(5),
      p(6),
      p(7),
      p(8),
      p(9),
      s(3),
      s(3),
      s(3),
      s(9),
      s(9),
    ];
    expect(
      errorOf(agari({ closed: noYaku, agariHai: s(3), isTsumo: false })),
    ).toBe("noYaku");
  });

  it("回答の符選択肢に無い符（110 符超）になる和了形は、検証でも再構築でも拒む", () => {
    // 東・南・西の暗槓 + 123m + 5p 単騎をロン（北家の東場）。
    // 副底 20 + 門前ロン 10 + 么九牌の暗槓 32 × 3 + 単騎 2 = 128 → 130 符
    const payload: AgariProblemPayload = {
      hand: {
        closed: [m(1), m(2), m(3), p(5), p(5)],
        exposed: [
          { type: "ankan", hais: [z(1), z(1), z(1), z(1)] },
          { type: "ankan", hais: [z(2), z(2), z(2), z(2)] },
          { type: "ankan", hais: [z(3), z(3), z(3), z(3)] },
        ],
      },
      agariHai: p(5),
      isTsumo: false,
      jikaze: HaiKind.Pei,
      bakaze: HaiKind.Ton,
      doraMarkers: [s(2), s(3), s(4), s(5)],
      riichi: null,
    };

    expect(errorOf({ kind: "agari-score", schemaVersion: 1, payload })).toBe(
      "fuOutOfOptions",
    );
    // 読み戻すときは閲覧者のルールで組み立て直すので、再構築の側でも見る
    expect(
      rebuildAgariQuestion(payload, {
        doubleWindJantouFu: 4,
        kiriageMangan: false,
      })._unsafeUnwrapErr(),
    ).toBe("fuOutOfOptions");
  });

  it("出題設定に依る条件（点数帯・親子など）は課さない", () => {
    // 親の満貫未満でも満貫以上でも、標準ルールで採点できれば受け付ける
    expect(
      parse(agari({ closed: PLAIN_AGARI, jikaze: HaiKind.Ton })).isOk(),
    ).toBe(true);
  });
});

describe("parsePracticeProblemArchiveRequest: 聴牌形", () => {
  it("出題した聴牌形の要求は受け付ける", () => {
    const question = noYakuRonTenpaiQuestion();
    const request: PracticeProblemArchiveRequest = {
      kind: "tenpai-score",
      schemaVersion: 1,
      payload: {
        hand: { closed: [...question.tehai.closed], exposed: [] },
        jikaze: question.jikaze,
        bakaze: question.bakaze,
        doraMarkers: [...question.doraMarkers],
        riichi: null,
      },
    };
    expect(parse(overTheWire(request)).isOk()).toBe(true);
  });

  it("枚数が聴牌形 13 枚相当でない手は拒む", () => {
    expect(errorOf(tenpai(PLAIN_AGARI))).toBe("invalidHaiCount");
  });

  it("1 面待ちの聴牌形は拒む", () => {
    // 123m 456p 789s 111z 2z の 2z 単騎
    const tanki = [
      m(1),
      m(2),
      m(3),
      p(4),
      p(5),
      p(6),
      s(7),
      s(8),
      s(9),
      z(1),
      z(1),
      z(1),
      z(2),
    ];
    expect(errorOf(tenpai(tanki))).toBe("tooFewWaits");
  });

  it("表示牌に取られて 4 枚目が無い待ち（純カラ）を持つ聴牌形は拒む", () => {
    // 111m 23m 456p 789s 白白: 1m・4m・白の待ち。1m は手牌の 3 枚と表示牌で 4 枚
    const closed = [
      m(1),
      m(1),
      m(1),
      m(2),
      m(3),
      p(4),
      p(5),
      p(6),
      s(7),
      s(8),
      s(9),
      z(5),
      z(5),
    ];
    expect(parse(tenpai(closed)).isOk()).toBe(true);
    expect(errorOf(tenpai(closed, { doraMarkers: [m(1)] }))).toBe("karaWait");
  });

  it("役なしのロン待ちを持つ聴牌形のリーチは拒む", () => {
    // 222m 456p 789p 33s 99s の 3s・9s の双碰。ロンはどちらも役なし
    const closed = [
      m(2),
      m(2),
      m(2),
      p(4),
      p(5),
      p(6),
      p(7),
      p(8),
      p(9),
      s(3),
      s(3),
      s(9),
      s(9),
    ];
    expect(parse(tenpai(closed)).isOk()).toBe(true);
    expect(
      errorOf(tenpai(closed, { riichi: { uraDoraMarkers: [z(3)] } })),
    ).toBe("riichiWithNoYakuRon");
  });
});
