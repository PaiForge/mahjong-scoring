import { describe, expect, it } from "vitest";
import {
  ARCHIVE_SCHEMA_VERSION,
  generateValidScoreQuestion,
  generateValidTenpaiScoreQuestion,
  parsePracticeProblemArchiveRequest,
  toAgariProblemPayload,
  toTenpaiProblemPayload,
} from "@mahjong-scoring/core";

import {
  agariArchiveRequestOf,
  tenpaiArchiveRequestOf,
} from "./archive-request";

describe("agariArchiveRequestOf", () => {
  it("和了形の種別と現行の版を付け、盤面は core の変換をそのまま載せる", () => {
    const question = generateValidScoreQuestion({
      includeFuro: true,
      includeChiitoi: false,
      allowedRanges: ["nonMangan", "manganPlus"],
    });
    if (question === undefined) throw new Error("問題を生成できなかった");

    const request = agariArchiveRequestOf(question);

    expect(request.kind).toBe("agari-score");
    expect(request.schemaVersion).toBe(ARCHIVE_SCHEMA_VERSION);
    expect(request.payload).toEqual(toAgariProblemPayload(question));
  });

  it("JSON を通してもサーバーの検証を通る", () => {
    const question = generateValidScoreQuestion({
      includeFuro: true,
      includeChiitoi: false,
      allowedRanges: ["nonMangan", "manganPlus"],
    });
    if (question === undefined) throw new Error("問題を生成できなかった");

    const wire: unknown = JSON.parse(
      JSON.stringify(agariArchiveRequestOf(question)),
    );

    expect(parsePracticeProblemArchiveRequest(wire).isOk()).toBe(true);
  });
});

describe("tenpaiArchiveRequestOf", () => {
  it("聴牌形の種別と現行の版を付け、盤面は core の変換をそのまま載せる", () => {
    const question = generateValidTenpaiScoreQuestion({
      includeFuro: true,
      allowedRanges: ["nonMangan", "manganPlus"],
    });
    if (question === undefined) throw new Error("問題を生成できなかった");

    const request = tenpaiArchiveRequestOf(question);

    expect(request.kind).toBe("tenpai-score");
    expect(request.schemaVersion).toBe(ARCHIVE_SCHEMA_VERSION);
    expect(request.payload).toEqual(toTenpaiProblemPayload(question));
  });

  it("JSON を通してもサーバーの検証を通る", () => {
    const question = generateValidTenpaiScoreQuestion({
      includeFuro: true,
      allowedRanges: ["nonMangan", "manganPlus"],
    });
    if (question === undefined) throw new Error("問題を生成できなかった");

    const wire: unknown = JSON.parse(
      JSON.stringify(tenpaiArchiveRequestOf(question)),
    );

    expect(parsePracticeProblemArchiveRequest(wire).isOk()).toBe(true);
  });
});
