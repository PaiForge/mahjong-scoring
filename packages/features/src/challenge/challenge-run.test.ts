import { describe, expect, it } from "vitest";

import {
  packStoredResults,
  parseRunId,
  RUN_PARAM,
  unpackStoredResults,
} from "./challenge-run";
import { FINISH_REASON_PARAM, FinishReason } from "./finish-reason";

const RUN = 1_700_000_000_000;
const rows = [{ id: "a" }, { id: "b" }];

describe("結果 URL のクエリ名", () => {
  it("回 ID と終了理由は空でない別々の名前で載り、同じ URL から両方を読み戻せる", () => {
    expect(RUN_PARAM).not.toBe("");
    expect(FINISH_REASON_PARAM).not.toBe("");
    expect(RUN_PARAM).not.toBe(FINISH_REASON_PARAM);

    const params = new URLSearchParams([
      [RUN_PARAM, String(RUN)],
      [FINISH_REASON_PARAM, FinishReason.TimeUp],
    ]);
    expect(parseRunId(params.get(RUN_PARAM) ?? undefined)).toBe(RUN);
    expect(params.get(FINISH_REASON_PARAM)).toBe(FinishReason.TimeUp);
  });
});

describe("parseRunId", () => {
  it("整数の文字列を回 ID として読む", () => {
    expect(parseRunId(String(RUN))).toBe(RUN);
  });

  it.each([
    ["付いていない", undefined],
    ["空文字列", ""],
    ["数値でない", "abc"],
    ["小数", "1.5"],
    ["配列（複数回付いた）", [String(RUN)]],
  ])("%s なら undefined", (_label, value) => {
    expect(parseRunId(value)).toBeUndefined();
  });
});

describe("unpackStoredResults", () => {
  it("回 ID が一致すれば保存した一覧を返す", () => {
    expect(unpackStoredResults(packStoredResults(RUN, rows), RUN)).toEqual(
      rows,
    );
  });

  it("別の回の保存なら undefined", () => {
    // 同じ練習の古い結果 URL を開いたとき、最新の回の一覧を出さない
    expect(
      unpackStoredResults(packStoredResults(RUN, rows), RUN + 1),
    ).toBeUndefined();
  });

  it("URL に回 ID が無ければ undefined", () => {
    expect(
      unpackStoredResults(packStoredResults(RUN, rows), undefined),
    ).toBeUndefined();
  });

  it.each([
    ["保存が無い", undefined],
    ["壊れた JSON", "{"],
    ["封筒でない（素の配列）", JSON.stringify(rows)],
    ["回 ID が数値でない", JSON.stringify({ run: "x", results: rows })],
    ["一覧が配列でない", JSON.stringify({ run: RUN, results: {} })],
  ])("%s なら undefined", (_label, raw) => {
    expect(unpackStoredResults(raw, RUN)).toBeUndefined();
  });
});
