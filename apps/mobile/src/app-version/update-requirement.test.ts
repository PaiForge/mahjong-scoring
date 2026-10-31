import { describe, expect, it } from "vitest";

import { isUpdateRequired } from "./update-requirement";

describe("isUpdateRequired", () => {
  it("最低バージョンを下回るときだけ求める", () => {
    expect(isUpdateRequired({ minimumVersion: "1.1.0" }, "1.0.0")).toBe(true);
    expect(isUpdateRequired({ minimumVersion: "1.1.0" }, "1.1.0")).toBe(false);
    expect(isUpdateRequired({ minimumVersion: "1.1.0" }, "1.2.0")).toBe(false);
  });

  it("最低バージョンが無い・形の違う応答では求めない", () => {
    expect(isUpdateRequired({}, "1.0.0")).toBe(false);
    expect(isUpdateRequired({ minimumVersion: 2 }, "1.0.0")).toBe(false);
    expect(isUpdateRequired(undefined, "1.0.0")).toBe(false);
  });

  it("自分の版が読めなければ求めない", () => {
    expect(isUpdateRequired({ minimumVersion: "9.0.0" }, undefined)).toBe(
      false,
    );
  });
});
