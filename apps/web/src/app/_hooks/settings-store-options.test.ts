import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useRuleSettingsStore } from "./use-rule-settings-store";

describe("web の設定ストアの保存先", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("localStorage に書けないとき（容量超過・プライベートモード）も設定の変更は落ちずにその場で効く", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    });
    const initial = useRuleSettingsStore.getState().kiriageMangan;

    expect(() => {
      useRuleSettingsStore.getState().setKiriageMangan(!initial);
    }).not.toThrow();
    expect(useRuleSettingsStore.getState().kiriageMangan).toBe(!initial);
  });

  it("localStorage が読めないときも保存が無いときと同じく再水和を終える", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("access denied", "SecurityError");
    });

    await useRuleSettingsStore.persist.rehydrate();

    expect(useRuleSettingsStore.persist.hasHydrated()).toBe(true);
  });
});
