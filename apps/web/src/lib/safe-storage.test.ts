import { describe, expect, it } from "vitest";

import { createSafeStorage } from "./safe-storage";

/** すべての操作で投げる Storage（容量超過・プライベートモード相当） */
function throwingStorage(): Storage {
  const fail = () => {
    throw new DOMException("quota exceeded", "QuotaExceededError");
  };
  return {
    length: 0,
    clear: fail,
    key: fail,
    getItem: fail,
    setItem: fail,
    removeItem: fail,
  };
}

describe("createSafeStorage", () => {
  it("使えるストレージはそのまま読み書きする", () => {
    const storage = createSafeStorage(() => sessionStorage);

    storage.setItem("k", "v");
    expect(storage.getItem("k")).toBe("v");

    storage.removeItem("k");
    expect(storage.getItem("k")).toBeNull();
  });

  it("操作が投げるときは読み取りを null にし、書き込みと削除を黙って捨てる", () => {
    const storage = createSafeStorage(throwingStorage);

    expect(storage.getItem("k")).toBeNull();
    expect(() => storage.setItem("k", "v")).not.toThrow();
    expect(() => storage.removeItem("k")).not.toThrow();
  });

  it("参照そのものが投げるとき（サイトデータの禁止）も同じに扱う", () => {
    const storage = createSafeStorage(() => {
      throw new DOMException("access denied", "SecurityError");
    });

    expect(storage.getItem("k")).toBeNull();
    expect(() => storage.setItem("k", "v")).not.toThrow();
    expect(() => storage.removeItem("k")).not.toThrow();
  });
});
