import { beforeEach, describe, expect, it } from "vitest";

import { useScoreSettingsStore } from "../use-score-settings-store";

const STORAGE_KEY = "mahjong-practice-settings";

/**
 * 保存済み設定を localStorage に書いてからストアを再水和する
 *
 * version 未設定で作られたストアも zustand は `version: 0` を書き出すため、
 * 既存ユーザーの保存データは必ず version を持つ。テストも同じ形にする
 * （version を省いた形にすると zustand は migrate を呼ばない）。
 *
 * @param version - zustand persist のバージョン（既定 0 = 移行前）
 */
async function rehydrateWith(
  state: Record<string, unknown>,
  version = 0,
): Promise<void> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, version }));
  await useScoreSettingsStore.persist.rehydrate();
}

describe("useScoreSettingsStore の永続化", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("v0 の snake_case な点数帯を camelCase へ変換する", async () => {
    await rehydrateWith({
      targetScoreRanges: ["non_mangan", "mangan_plus"],
    });

    expect(useScoreSettingsStore.getState().targetScoreRanges).toEqual([
      "nonMangan",
      "manganPlus",
    ]);
  });

  it("v0 で片方だけ選ばれていた場合もその選択を保つ", async () => {
    await rehydrateWith({ targetScoreRanges: ["mangan_plus"] });

    expect(useScoreSettingsStore.getState().targetScoreRanges).toEqual([
      "manganPlus",
    ]);
  });

  it("v0 で空選択なら空のまま（意図的に全部外した状態を壊さない）", async () => {
    await rehydrateWith({ targetScoreRanges: [] });

    expect(useScoreSettingsStore.getState().targetScoreRanges).toEqual([]);
  });

  it("v1 の値はそのまま読み込む", async () => {
    await rehydrateWith({ targetScoreRanges: ["nonMangan"] }, 1);

    expect(useScoreSettingsStore.getState().targetScoreRanges).toEqual([
      "nonMangan",
    ]);
  });

  it("点数帯以外の設定は移行で失われない", async () => {
    await rehydrateWith({
      targetScoreRanges: ["non_mangan"],
      requireYaku: true,
      simplifyMangan: true,
      includeParent: false,
    });

    const state = useScoreSettingsStore.getState();
    expect(state.requireYaku).toBe(true);
    expect(state.simplifyMangan).toBe(true);
    expect(state.includeParent).toBe(false);
  });
});
