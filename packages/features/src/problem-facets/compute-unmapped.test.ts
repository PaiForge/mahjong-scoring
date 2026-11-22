import { describe, expect, it, vi } from "vitest";

import { eligibleAgariPayload } from "../daily-problem/test-fixtures";

import { computeProblemFacets } from "./compute";
import {
  agariInput,
  noYakuRonTenpaiPayload,
  riichiTenpaiPayload,
  tenpaiInput,
} from "./test-fixtures";

// 役 ID に写せない内訳はライブラリの改名でしか起きないので、取り出しを差し替えて再現する
vi.mock("@mahjong-scoring/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@mahjong-scoring/core")>()),
  extractScoreFacts: () => undefined,
}));

describe("computeProblemFacets（役 ID に写せない内訳）", () => {
  it("行を作らず、unmappedYaku の failed にする", () => {
    const failed = {
      set: { status: "failed", error: "unmappedYaku" },
      rows: [],
    };
    expect(computeProblemFacets(agariInput(eligibleAgariPayload()))).toEqual(
      failed,
    );
    expect(computeProblemFacets(tenpaiInput(riichiTenpaiPayload()))).toEqual(
      failed,
    );
    expect(computeProblemFacets(tenpaiInput(noYakuRonTenpaiPayload()))).toEqual(
      failed,
    );
  });
});
