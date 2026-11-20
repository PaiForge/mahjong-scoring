import { describe, expect, it } from "vitest";

import { isRole, isWinType, paymentKindOf, roleOf } from "./roles";

describe("roleOf", () => {
  it("親なら oya、子なら ko", () => {
    expect(roleOf(true)).toBe("oya");
    expect(roleOf(false)).toBe("ko");
  });
});

describe("isRole", () => {
  it("oya と ko だけを立場として受け入れる", () => {
    expect(isRole("oya")).toBe(true);
    expect(isRole("ko")).toBe(true);
  });

  it("和了方法や空文字・大文字違いは立場ではない", () => {
    expect(isRole("tsumo")).toBe(false);
    expect(isRole("")).toBe(false);
    expect(isRole("OYA")).toBe(false);
  });
});

describe("isWinType", () => {
  it("tsumo と ron だけを和了方法として受け入れる", () => {
    expect(isWinType("tsumo")).toBe(true);
    expect(isWinType("ron")).toBe(true);
  });

  it("立場や空文字・大文字違いは和了方法ではない", () => {
    expect(isWinType("oya")).toBe(false);
    expect(isWinType("")).toBe(false);
    expect(isWinType("RON")).toBe(false);
  });
});

describe("paymentKindOf", () => {
  it("ロンは親でも子でも放銃者ひとりからの 1 口", () => {
    expect(paymentKindOf(true, false)).toBe("ron");
    expect(paymentKindOf(false, false)).toBe("ron");
  });

  it("親ツモは全員から同額の oyaTsumo", () => {
    expect(paymentKindOf(true, true)).toBe("oyaTsumo");
  });

  it("子ツモだけが子と親から別額の koTsumo", () => {
    expect(paymentKindOf(false, true)).toBe("koTsumo");
  });
});
