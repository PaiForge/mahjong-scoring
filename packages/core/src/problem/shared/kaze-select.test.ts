import { describe, expect, it } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";
import { KAZEHAI } from "../../core/constants";
import { selectJikaze } from "./kaze-select";

/** 乱数の値を 0 から 1 の手前まで等間隔に振り、選ばれうる風を全部集める */
function sampledJikaze(includeParent: boolean, includeChild: boolean) {
  const picked = new Set<HaiKind>();
  for (let step = 0; step < 100; step++) {
    picked.add(selectJikaze(includeParent, includeChild, () => step / 100));
  }
  return picked;
}

describe("selectJikaze", () => {
  it("親も子も出すなら全風から選ぶ", () => {
    expect(sampledJikaze(true, true)).toEqual(new Set(KAZEHAI));
  });

  it("親だけなら東しか出ない", () => {
    expect(sampledJikaze(true, false)).toEqual(new Set([HaiKind.Ton]));
  });

  it("子だけなら東を出さない", () => {
    expect(sampledJikaze(false, true)).toEqual(
      new Set(KAZEHAI.filter((kaze) => kaze !== HaiKind.Ton)),
    );
  });

  it("両方落とすと候補が無くなるので全風から選ぶ", () => {
    expect(sampledJikaze(false, false)).toEqual(new Set(KAZEHAI));
  });
});
