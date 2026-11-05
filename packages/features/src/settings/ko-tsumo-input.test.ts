import { describe, expect, it } from "vitest";

import { resolveKoTsumoInput } from "./ko-tsumo-input";

describe("resolveKoTsumoInput", () => {
  it("タイル入力では保存した方式に依らず組で答える", () => {
    expect(resolveKoTsumoInput("tiles", "split")).toBe("combined");
    expect(resolveKoTsumoInput("tiles", "combined")).toBe("combined");
  });

  it("select 入力では保存した方式をそのまま使う", () => {
    expect(resolveKoTsumoInput("select", "split")).toBe("split");
    expect(resolveKoTsumoInput("select", "combined")).toBe("combined");
  });
});
