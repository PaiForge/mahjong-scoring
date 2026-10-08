// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createRuleSettingsStore } from "./use-rule-settings-store";
import { createScoreSettingsStore } from "./use-score-settings-store";
import { createTrainingSettingsStore } from "./use-training-settings-store";
import {
  createAsyncStorage,
  createMemoryStorage,
} from "../test/memory-storage";

describe("設定ストアの保存先の注入", () => {
  it("渡した保存先に既存の保存名で書き込む", () => {
    // 保存名を変えると既存ユーザーの設定が読めなくなるため固定する
    const { data, storage } = createMemoryStorage();
    const { useRuleSettingsStore } = createRuleSettingsStore({
      storage: () => storage,
    });

    act(() => useRuleSettingsStore.getState().setKiriageMangan(true));

    const saved = JSON.parse(data.get("mahjong-rule-settings") ?? "{}");
    expect(saved.state.kiriageMangan).toBe(true);
  });

  it("同期の保存先なら生成した時点で保存値が載っている", () => {
    // 出題側は getState() でルールを読むため、描画を待たずに値が要る
    const { storage } = createMemoryStorage({
      "mahjong-rule-settings": JSON.stringify({
        state: { kiriageMangan: true },
        version: 0,
      }),
    });
    const { useRuleSettingsStore } = createRuleSettingsStore({
      storage: () => storage,
    });

    expect(useRuleSettingsStore.getState().kiriageMangan).toBe(true);
  });

  it("非同期の保存先でも読み込み後に保存値が反映される", async () => {
    const { storage } = createAsyncStorage({
      "mahjong-training-settings": JSON.stringify({
        state: { autoAdvanceOnCorrect: true },
        version: 0,
      }),
    });
    const { useAutoAdvanceOnCorrect } = createTrainingSettingsStore({
      storage: () => storage,
    });

    const { result } = renderHook(() => useAutoAdvanceOnCorrect());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("ハイドレーションガードが既定値を返す間は保存値を出さない", () => {
    const { storage } = createMemoryStorage({
      "mahjong-training-settings": JSON.stringify({
        state: { autoAdvanceOnCorrect: true },
        version: 0,
      }),
    });
    const { useAutoAdvanceOnCorrect } = createTrainingSettingsStore({
      storage: () => storage,
      // サーバー描画とハイドレーション前（web）を模す
      useHydrated: (_value, fallback) => fallback,
    });

    const { result } = renderHook(() => useAutoAdvanceOnCorrect());
    expect(result.current).toBe(false);
  });
});

describe("点数練習の設定ストアの移行", () => {
  it("v1 の保存値から「自動で次へ」を落とし、他の値は残す", () => {
    // 「自動で次へ」はトレーニング設定に一本化した。旧キーを残すと、
    // 書き込みのたびに使われない値が保存され続ける
    const { data, storage } = createMemoryStorage({
      "score-settings": JSON.stringify({
        state: { autoNext: true, requireYaku: true },
        version: 1,
      }),
    });
    const useStore = createScoreSettingsStore("score-settings", {
      storage: () => storage,
    });

    expect(useStore.getState()).not.toHaveProperty("autoNext");
    expect(useStore.getState().requireYaku).toBe(true);

    act(() => useStore.getState().setExactHan(true));
    const saved = JSON.parse(data.get("score-settings") ?? "{}");
    expect(saved.state).not.toHaveProperty("autoNext");
    expect(saved.version).toBe(2);
  });

  it("v0 の点数帯の表記も引き続き直す", () => {
    const { storage } = createMemoryStorage({
      "score-settings": JSON.stringify({
        state: { autoNext: true, targetScoreRanges: ["non_mangan"] },
        version: 0,
      }),
    });
    const useStore = createScoreSettingsStore("score-settings", {
      storage: () => storage,
    });

    expect(useStore.getState().targetScoreRanges).toEqual(["nonMangan"]);
    expect(useStore.getState()).not.toHaveProperty("autoNext");
  });
});
