import { describe, expect, it } from "vitest";

import { parseExtendedMpsz } from "@mahjong-scoring/core";

import { convertLegacyExtendedMpsz } from "./legacy-mpsz.mjs";

describe("convertLegacyExtendedMpsz", () => {
  it.each([
    ["123m456p789s11z", "123m456p789s11z"],
    ["321m1m", "321m1m"],
    ["[123m]", "[1-23m]"],
    ["[321m]", "[1-23m]"],
    ["[555p]", "[5=55p]"],
    ["[5555p]", "[5=555p]"],
    ["[777z]", "[7=77z]"],
    ["(1111z)", "(1111z)"],
    ["22m33p44s[555m][666p]", "22m33p44s[5=55m][6=66p]"],
    ["19m19p19s1234567z(8888s)", "19m19p19s1234567z(8888s)"],
    ["[234s]123m(1111z)11p", "[2-34s]123m(1111z)11p"],
    ["", ""],
  ])("%s → %s", (legacy, expected) => {
    const result = convertLegacyExtendedMpsz(legacy);
    expect(result).toEqual({ ok: true, value: expected });
  });

  it("書き換えた文字列は 2.0 のパーサーで受理され、牌の並びを保つ", () => {
    const result = convertLegacyExtendedMpsz("321m[555p]");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // parseTehai は理牌するので、表記の順のまま読む parseExtendedMpsz で確かめる
    const parsed = parseExtendedMpsz(result.value);
    expect(parsed.isOk()).toBe(true);
    if (parsed.isErr()) return;
    expect(parsed.value.closed).toEqual([2, 1, 0]);
    expect(parsed.value.exposed).toHaveLength(1);
  });

  it.each([
    ["105m", "redFive"],
    ["[406m]", "redFive"],
    ["0z123m", "redFive"],
    ["18z", "honorOutOfRange"],
    ["[999z]", "honorOutOfRange"],
    ["[1m2m3m]", "invalidSyntax"],
    ["[123]", "invalidSyntax"],
    ["123m 456p", "invalidSyntax"],
    ["123M", "invalidSyntax"],
    ["1[222p]23m", "invalidSyntax"],
    ["[124m]", "invalidMeld"],
    ["[123z]", "invalidMeld"],
    ["[55p]", "invalidMeld"],
    ["(555p)", "invalidMeld"],
    ["(1234m)", "invalidMeld"],
  ])("%s は書き換えず理由 %s を返す", (legacy, reason) => {
    expect(convertLegacyExtendedMpsz(legacy)).toEqual({ ok: false, reason });
  });
});
