import { describe, it, expect } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";
import { getKazeName, getKeyForKazehai, isOya } from "./kaze";

describe("getKazeName", () => {
  it("東を返す", () => {
    expect(getKazeName(HaiKind.Ton)).toBe("東");
  });

  it("南を返す", () => {
    expect(getKazeName(HaiKind.Nan)).toBe("南");
  });

  it("西を返す", () => {
    expect(getKazeName(HaiKind.Sha)).toBe("西");
  });

  it("北を返す", () => {
    expect(getKazeName(HaiKind.Pei)).toBe("北");
  });
});

describe("getKeyForKazehai", () => {
  it("東 → Ton", () => {
    expect(getKeyForKazehai(HaiKind.Ton)).toBe("Ton");
  });

  it("南 → Nan", () => {
    expect(getKeyForKazehai(HaiKind.Nan)).toBe("Nan");
  });

  it("西 → Sha", () => {
    expect(getKeyForKazehai(HaiKind.Sha)).toBe("Sha");
  });

  it("北 → Pei", () => {
    expect(getKeyForKazehai(HaiKind.Pei)).toBe("Pei");
  });
});

describe("isOya", () => {
  it("東は親", () => {
    expect(isOya(HaiKind.Ton)).toBe(true);
  });

  it("南・西・北は子", () => {
    expect(isOya(HaiKind.Nan)).toBe(false);
    expect(isOya(HaiKind.Sha)).toBe(false);
    expect(isOya(HaiKind.Pei)).toBe(false);
  });
});
