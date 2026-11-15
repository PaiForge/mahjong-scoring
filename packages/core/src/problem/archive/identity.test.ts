import { describe, expect, it } from "vitest";
import { archiveIdentityInput } from "./identity";
import {
  agariRequest,
  ankanRiichiAgariQuestion,
  meldedAgariQuestion,
  noYakuRonTenpaiQuestion,
  riichiTenpaiQuestion,
  tenpaiRequest,
} from "./test-fixtures";
import type {
  AgariProblemPayload,
  ArchivedMeld,
  PracticeProblemArchiveRequest,
} from "./types";

/** 4 副露の和了形の要求と、その盤面 */
function melded(): {
  request: PracticeProblemArchiveRequest;
  payload: AgariProblemPayload;
} {
  const request = agariRequest(meldedAgariQuestion());
  if (request.kind !== "agari-score") throw new Error(request.kind);
  return { request, payload: request.payload };
}

function withPayload(
  overrides: Partial<AgariProblemPayload>,
): PracticeProblemArchiveRequest {
  const { payload } = melded();
  return {
    kind: "agari-score",
    schemaVersion: 1,
    payload: { ...payload, ...overrides },
  };
}

function withExposed(exposed: ArchivedMeld[]): PracticeProblemArchiveRequest {
  const { payload } = melded();
  return withPayload({ hand: { ...payload.hand, exposed } });
}

describe("archiveIdentityInput: 同じ問題とみなすもの", () => {
  it("純手牌の並びが違っても同じ盤面なら同じ文字列", () => {
    const request = agariRequest(ankanRiichiAgariQuestion());
    if (request.kind !== "agari-score") throw new Error(request.kind);
    const reversed: PracticeProblemArchiveRequest = {
      ...request,
      payload: {
        ...request.payload,
        hand: {
          ...request.payload.hand,
          closed: [...request.payload.hand.closed].reverse(),
        },
      },
    };
    expect(archiveIdentityInput(reversed)).toBe(archiveIdentityInput(request));
  });

  it("JSON のキーの順が違っても同じ文字列", () => {
    const { request, payload } = melded();
    const reordered: PracticeProblemArchiveRequest = {
      payload: {
        riichi: payload.riichi,
        doraMarkers: payload.doraMarkers,
        bakaze: payload.bakaze,
        jikaze: payload.jikaze,
        isTsumo: payload.isTsumo,
        agariHai: payload.agariHai,
        hand: { exposed: payload.hand.exposed, closed: payload.hand.closed },
      },
      schemaVersion: 1,
      kind: "agari-score",
    };
    expect(archiveIdentityInput(reordered)).toBe(archiveIdentityInput(request));
  });

  it("鳴き元（from）が違っても同じ文字列（鳴き元は点数に効かない）", () => {
    const { request, payload } = melded();
    const otherFrom = withExposed(
      payload.hand.exposed.map((meld) =>
        meld.type === "chi" || meld.type === "ankan"
          ? meld
          : { ...meld, from: "toimen" },
      ),
    );
    expect(archiveIdentityInput(otherFrom)).toBe(archiveIdentityInput(request));
  });
});

describe("archiveIdentityInput: 別の問題とみなすもの", () => {
  const base = archiveIdentityInput(melded().request);

  it("副露の種別が違えば別の文字列（大明槓と加槓）", () => {
    const { payload } = melded();
    const [chi, pon, daiminkan, kakan] = payload.hand.exposed;
    const swapped = withExposed([
      chi,
      pon,
      { type: "kakan", hais: daiminkan.hais, from: "kamicha" },
      { type: "daiminkan", hais: kakan.hais, from: "toimen" },
    ]);
    expect(archiveIdentityInput(swapped)).not.toBe(base);
  });

  it("副露の順（鳴いた順）が違えば別の文字列", () => {
    const { payload } = melded();
    const reversed = withExposed([...payload.hand.exposed].reverse());
    expect(archiveIdentityInput(reversed)).not.toBe(base);
  });

  it("チーの鳴いた牌が違えば別の文字列", () => {
    const { payload } = melded();
    const [chi, ...rest] = payload.hand.exposed;
    if (chi.type !== "chi") throw new Error(chi.type);
    const otherNaki = withExposed([{ ...chi, nakiHai: chi.hais[0] }, ...rest]);
    expect(archiveIdentityInput(otherNaki)).not.toBe(base);
  });

  it("和了牌・ツモ / ロン・自風・場風が違えば別の文字列", () => {
    const { payload } = melded();
    const variants = [
      withPayload({ agariHai: payload.agariHai + 1 }),
      withPayload({ isTsumo: !payload.isTsumo }),
      withPayload({ jikaze: payload.bakaze }),
      withPayload({ bakaze: payload.jikaze }),
    ];
    for (const variant of variants) {
      expect(archiveIdentityInput(variant)).not.toBe(base);
    }
  });

  it("表ドラ表示牌の牌・順が違えば別の文字列", () => {
    const { payload } = melded();
    const [first, ...rest] = payload.doraMarkers;
    expect(
      archiveIdentityInput(withPayload({ doraMarkers: [...rest, first] })),
    ).not.toBe(base);
    expect(
      archiveIdentityInput(withPayload({ doraMarkers: [first + 1, ...rest] })),
    ).not.toBe(base);
  });

  it("リーチの有無・裏ドラ表示牌が違えば別の文字列", () => {
    const request = agariRequest(ankanRiichiAgariQuestion());
    if (request.kind !== "agari-score") throw new Error(request.kind);
    const riichi = archiveIdentityInput(request);
    const noRiichi = archiveIdentityInput({
      ...request,
      payload: { ...request.payload, riichi: null },
    });
    const otherUra = archiveIdentityInput({
      ...request,
      payload: { ...request.payload, riichi: { uraDoraMarkers: [0, 1] } },
    });
    expect(noRiichi).not.toBe(riichi);
    expect(otherUra).not.toBe(riichi);
  });

  it("和了形と聴牌形は同じ牌でも別の文字列", () => {
    const tenpai = tenpaiRequest(noYakuRonTenpaiQuestion());
    const agari = agariRequest(ankanRiichiAgariQuestion());
    expect(archiveIdentityInput(tenpai)).not.toBe(archiveIdentityInput(agari));
    expect(archiveIdentityInput(tenpai).startsWith('["tenpai-score",1,')).toBe(
      true,
    );
  });
});

describe("archiveIdentityInput: identity v1 の固定値（変えると保存済みの行と食い違う）", () => {
  it("4 副露の和了形", () => {
    expect(archiveIdentityInput(melded().request)).toMatchInlineSnapshot(
      `"["agari-score",1,[5,5],[["chi",[1,2,3],2],["pon",[31,31,31]],["daiminkan",[17,17,17,17]],["kakan",[18,18,18,18]]],5,true,28,27,[30,0,22],null]"`,
    );
  });

  it("暗槓とリーチの和了形", () => {
    expect(
      archiveIdentityInput(agariRequest(ankanRiichiAgariQuestion())),
    ).toMatchInlineSnapshot(
      `"["agari-score",1,[0,1,2,3,4,5,20,20,24,25,26],[["ankan",[10,10,10,10]]],26,true,29,28,[30,0],[29,13]]"`,
    );
  });

  it("役なしのロン待ちを持つ聴牌形", () => {
    expect(
      archiveIdentityInput(tenpaiRequest(noYakuRonTenpaiQuestion())),
    ).toMatchInlineSnapshot(
      `"["tenpai-score",1,[1,1,1,12,13,14,15,16,17,20,20,26,26],[],28,27,[30],null]"`,
    );
  });

  it("リーチした聴牌形", () => {
    expect(
      archiveIdentityInput(tenpaiRequest(riichiTenpaiQuestion())),
    ).toMatchInlineSnapshot(
      `"["tenpai-score",1,[1,2,3,11,12,13,14,15,22,22,23,24,25],[],27,27,[32],[8]]"`,
    );
  });
});
