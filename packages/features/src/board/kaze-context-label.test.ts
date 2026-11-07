import { describe, expect, it } from "vitest";
import {
  HaiKind,
  getKazeName,
  kazeNameKey,
  type Kazehai,
} from "@mahjong-scoring/core";
import { messages } from "@mahjong-scoring/messages/ja";

import { kazeContextLabel } from "./kaze-context-label";

/** 日本語の辞書の風の名前（`common.kazeNames`） */
const jaKazeNames: Readonly<Record<string, string>> = messages.common.kazeNames;

/** 日本語の辞書の `common`（ここで引く語だけ） */
const tJa = (key: string): string => {
  if (key === "round") return messages.common.round;
  if (key === "wind") return messages.common.wind;
  return jaKazeNames[key.replace(/^kazeNames\./, "")] ?? key;
};

const ALL_KAZE: readonly Kazehai[] = [
  HaiKind.Ton,
  HaiKind.Nan,
  HaiKind.Sha,
  HaiKind.Pei,
];

describe("kazeContextLabel", () => {
  it("場風・自風の名前に「場」「家」を添え、間を空白で区切る（日本語の出力は従来どおり）", () => {
    expect(kazeContextLabel(HaiKind.Ton, HaiKind.Nan, tJa)).toBe("東場 南家");
    expect(kazeContextLabel(HaiKind.Nan, HaiKind.Pei, tJa)).toBe("南場 北家");
  });

  it("どの組み合わせでも core の getKazeName で組んだ従来の文字列と一致する", () => {
    for (const bakaze of ALL_KAZE) {
      for (const jikaze of ALL_KAZE) {
        expect(kazeContextLabel(bakaze, jikaze, tJa)).toBe(
          `${getKazeName(bakaze)}場 ${getKazeName(jikaze)}家`,
        );
      }
    }
  });

  it("風の名前は common.kazeNames.<key> で引く", () => {
    const t = (key: string): string => `<${key}>`;
    expect(kazeContextLabel(HaiKind.Sha, HaiKind.Ton, t)).toBe(
      "<kazeNames.sha><round> <kazeNames.ton><wind>",
    );
  });

  it("日本語の辞書の common.kazeNames は core の getKazeName と同じ文字列", () => {
    for (const kaze of ALL_KAZE) {
      expect(jaKazeNames[kazeNameKey(kaze)]).toBe(getKazeName(kaze));
    }
  });
});
