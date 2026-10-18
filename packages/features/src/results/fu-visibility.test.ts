import type { ScoreQuestion } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { resolveFuVisibility } from "./fu-visibility";

const answerOf = (han: number, scoreLevel: string) =>
  ({ han, scoreLevel }) as unknown as ScoreQuestion["answer"];

describe("resolveFuVisibility", () => {
  it("満貫未満は符の行も内訳も出す", () => {
    expect(
      resolveFuVisibility(answerOf(3, "Normal"), { requireFuForMangan: false }),
    ).toEqual({ row: true, breakdown: true });
  });

  it("符で満貫に届いた 4 翻以下は、符の行は出さず内訳だけ出す", () => {
    expect(
      resolveFuVisibility(answerOf(3, "Mangan"), { requireFuForMangan: false }),
    ).toEqual({ row: false, breakdown: true });
  });

  it("5 翻以上の満貫は符を出さない", () => {
    expect(
      resolveFuVisibility(answerOf(5, "Mangan"), { requireFuForMangan: false }),
    ).toEqual({ row: false, breakdown: false });
  });

  it("符を答えさせる設定なら満貫以上でも符の行と内訳を出す", () => {
    expect(
      resolveFuVisibility(answerOf(6, "Haneman"), { requireFuForMangan: true }),
    ).toEqual({ row: true, breakdown: true });
  });
});
