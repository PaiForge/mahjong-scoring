import { describe, expect, it } from "vitest";
import { HaiKind, type Kazehai } from "@pai-forge/riichi-mahjong";
import { BAKAZE_OPTIONS, KAZEHAI } from "../../core/constants";
import { selectBakaze, selectJikaze } from "./kaze-select";

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

/** 乱数の値を 0 から 1 の手前まで等間隔に振り、選ばれうる場風を全部集める */
function sampledBakaze(jikaze: Kazehai, excludeRenfonpai: boolean) {
  const picked = new Set<Kazehai>();
  for (let step = 0; step < 100; step++) {
    picked.add(selectBakaze(jikaze, excludeRenfonpai, () => step / 100));
  }
  return picked;
}

describe("selectBakaze", () => {
  it("連風牌を除かなければ出題する場風のどれからも選ぶ", () => {
    expect(sampledBakaze(HaiKind.Ton, false)).toEqual(new Set(BAKAZE_OPTIONS));
  });

  it("連風牌を除くと自風と同じ風を場風にしない", () => {
    expect(sampledBakaze(HaiKind.Ton, true)).toEqual(
      new Set(BAKAZE_OPTIONS.filter((kaze) => kaze !== HaiKind.Ton)),
    );
  });

  it("自風が出題する場風に無い風なら、連風牌を除いても全場風から選ぶ", () => {
    expect(sampledBakaze(HaiKind.Sha, true)).toEqual(new Set(BAKAZE_OPTIONS));
  });
});
