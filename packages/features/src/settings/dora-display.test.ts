import { HaiKind } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { resolveBoardDora, resolveDoraTiles } from "./dora-display";

describe("resolveDoraTiles", () => {
  const markers = [HaiKind.ManZu9, HaiKind.Pei, HaiKind.Chun];

  it("indicator では表示牌をそのまま返す", () => {
    expect(resolveDoraTiles(markers, "indicator")).toEqual(markers);
  });

  it("actual では表示牌の次の牌（グループ末尾は先頭へループ）を返す", () => {
    expect(resolveDoraTiles(markers, "actual")).toEqual([
      HaiKind.ManZu1,
      HaiKind.Ton,
      HaiKind.Haku,
    ]);
  });

  it("空配列はどちらのモードでも空", () => {
    expect(resolveDoraTiles([], "indicator")).toEqual([]);
    expect(resolveDoraTiles([], "actual")).toEqual([]);
  });
});

describe("resolveBoardDora", () => {
  const context = {
    doraMarkers: [HaiKind.ManZu9],
    uraDoraMarkers: [HaiKind.Pei],
  };

  it("リーチしていれば裏ドラも表示モードどおりに引く", () => {
    expect(resolveBoardDora({ ...context, isRiichi: true }, "actual")).toEqual({
      doraTiles: [HaiKind.ManZu1],
      uraDoraTiles: [HaiKind.Ton],
    });
  });

  it("リーチしていなければ裏ドラは空", () => {
    expect(
      resolveBoardDora({ ...context, isRiichi: false }, "indicator"),
    ).toEqual({ doraTiles: [HaiKind.ManZu9], uraDoraTiles: [] });
  });
});
