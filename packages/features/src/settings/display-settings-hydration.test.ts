// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StateStorage } from "zustand/middleware";

import { createDisplaySettingsStore } from "./use-display-settings-store";
import {
  createAsyncStorage,
  createMemoryStorage,
} from "../test/memory-storage";

const NAME = "mahjong-display-settings";

/** 保存値の JSON */
function saved(state: Record<string, unknown>): Record<string, string> {
  return { [NAME]: JSON.stringify({ state, version: 0 }) };
}

/** 手で完了させる非同期の保存先 */
function createDeferredStorage() {
  const pending: {
    resolve: (value: string | null) => void;
    reject: (error: unknown) => void;
  }[] = [];
  const setItem = vi.fn();
  const storage: StateStorage = {
    getItem: () =>
      new Promise<string | null>((resolve, reject) => {
        pending.push({ resolve, reject });
      }),
    setItem,
    removeItem: () => undefined,
  };
  return { storage, pending, setItem };
}

describe("表示設定の手牌の向き", () => {
  it("既定は upright で、保存名は変えない", () => {
    const { data, storage } = createMemoryStorage();
    const { useDisplaySettingsStore } = createDisplaySettingsStore({
      storage: () => storage,
    });
    expect(useDisplaySettingsStore.getState().tileOrientation).toBe("upright");

    act(() => useDisplaySettingsStore.getState().setTileOrientation("random"));
    const persisted = JSON.parse(data.get(NAME) ?? "{}");
    expect(persisted.state.tileOrientation).toBe("random");
  });

  it("項目が無い既存の保存値は upright にし、他の設定を残す", () => {
    const { storage } = createMemoryStorage(
      saved({ doraDisplay: "actual", fuHanOrder: "fu-first" }),
    );
    const { useDisplaySettingsStore } = createDisplaySettingsStore({
      storage: () => storage,
    });
    const state = useDisplaySettingsStore.getState();
    expect(state.tileOrientation).toBe("upright");
    expect(state.doraDisplay).toBe("actual");
    expect(state.fuHanOrder).toBe("fu-first");
  });

  it.each([["sideways"], [1], [null], [{ mode: "random" }]])(
    "未知の値・型違い（%j）は upright",
    (value) => {
      const { storage } = createMemoryStorage(
        saved({ tileOrientation: value }),
      );
      const { useDisplaySettingsStore } = createDisplaySettingsStore({
        storage: () => storage,
      });
      expect(useDisplaySettingsStore.getState().tileOrientation).toBe(
        "upright",
      );
    },
  );

  it("保存した random を復元する", () => {
    const { storage } = createMemoryStorage(
      saved({ tileOrientation: "random" }),
    );
    const { useDisplaySettingsStore } = createDisplaySettingsStore({
      storage: () => storage,
    });
    expect(useDisplaySettingsStore.getState().tileOrientation).toBe("random");
  });

  it("不正な永続値で更新関数を置き換えない", () => {
    const { storage } = createMemoryStorage(
      saved({ setTileOrientation: "broken", termLinks: "yes" }),
    );
    const { useDisplaySettingsStore } = createDisplaySettingsStore({
      storage: () => storage,
    });
    const state = useDisplaySettingsStore.getState();
    expect(typeof state.setTileOrientation).toBe("function");
    expect(state.termLinks).toBe(true);
    act(() => state.setTileOrientation("random"));
    expect(useDisplaySettingsStore.getState().tileOrientation).toBe("random");
  });

  it("保存値の読み取りフックは希望をそのまま返す", () => {
    const { storage } = createMemoryStorage(
      saved({ tileOrientation: "random" }),
    );
    const { useTileOrientationSetting } = createDisplaySettingsStore({
      storage: () => storage,
    });
    const { result } = renderHook(() => useTileOrientationSetting());
    expect(result.current).toBe("random");
  });
});

describe("表示設定の復元状態", () => {
  it("同期の保存先（localStorage 相当）はストアを作った時点で ready", () => {
    const { storage } = createMemoryStorage(
      saved({ tileOrientation: "random" }),
    );
    const { useDisplaySettingsHydration } = createDisplaySettingsStore({
      storage: () => storage,
    });
    const { result } = renderHook(() => useDisplaySettingsHydration());
    expect(result.current).toBe("ready");
  });

  it("非同期の保存先（AsyncStorage 相当）は読み終わってから ready", async () => {
    const { storage } = createAsyncStorage(
      saved({ tileOrientation: "random" }),
    );
    const { useDisplaySettingsHydration, useDisplaySettingsStore } =
      createDisplaySettingsStore({ storage: () => storage });
    const { result } = renderHook(() => useDisplaySettingsHydration());
    expect(result.current).toBe("pending");
    // 読み終わる前のメモリ上の値は既定値で、保存値ではない
    expect(useDisplaySettingsStore.getState().tileOrientation).toBe("upright");
    await waitFor(() => expect(result.current).toBe("ready"));
    expect(useDisplaySettingsStore.getState().tileOrientation).toBe("random");
  });

  it("読み込みに失敗したら failed", async () => {
    const { storage, pending } = createDeferredStorage();
    const { useDisplaySettingsHydration } = createDisplaySettingsStore({
      storage: () => storage,
    });
    const { result } = renderHook(() => useDisplaySettingsHydration());
    await act(async () => {
      pending[0]?.reject(new Error("unavailable"));
    });
    expect(result.current).toBe("failed");
  });

  it("保存値が壊れた JSON でも failed になり、設定は既定値のまま", () => {
    const { storage } = createMemoryStorage({ [NAME]: "{broken" });
    const { useDisplaySettingsHydration, useDisplaySettingsStore } =
      createDisplaySettingsStore({ storage: () => storage });
    const { result } = renderHook(() => useDisplaySettingsHydration());
    expect(result.current).toBe("failed");
    expect(useDisplaySettingsStore.getState().tileOrientation).toBe("upright");
  });

  it("読み込みが終わらない間は pending のまま", async () => {
    const { storage } = createDeferredStorage();
    const { useDisplaySettingsHydration } = createDisplaySettingsStore({
      storage: () => storage,
    });
    const { result } = renderHook(() => useDisplaySettingsHydration());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(result.current).toBe("pending");
  });

  it("読み込み状態の遷移だけでは保存先へ書き込まない", async () => {
    const { storage, pending, setItem } = createDeferredStorage();
    const { useDisplaySettingsHydration } = createDisplaySettingsStore({
      storage: () => storage,
    });
    const { result } = renderHook(() => useDisplaySettingsHydration());
    await act(async () => {
      pending[0]?.resolve(JSON.stringify({ state: {}, version: 0 }));
    });
    expect(result.current).toBe("ready");
    expect(setItem).not.toHaveBeenCalled();
  });

  it("重なった rehydrate では古い成功・失敗で最新の状態を上書きしない", async () => {
    const { storage, pending } = createDeferredStorage();
    const { useDisplaySettingsHydration, useDisplaySettingsStore } =
      createDisplaySettingsStore({ storage: () => storage });
    const { result } = renderHook(() => useDisplaySettingsHydration());

    // 2 回目の読み込みを始める（1 回目は未完了のまま）
    act(() => void useDisplaySettingsStore.persist.rehydrate());
    expect(pending).toHaveLength(2);

    // 最新（2 回目）が成功した後に、古い（1 回目）が失敗しても ready のまま
    await act(async () => {
      pending[1]?.resolve(
        JSON.stringify({ state: { tileOrientation: "random" }, version: 0 }),
      );
    });
    expect(result.current).toBe("ready");
    await act(async () => {
      pending[0]?.reject(new Error("stale"));
    });
    expect(result.current).toBe("ready");
    expect(useDisplaySettingsStore.getState().tileOrientation).toBe("random");

    // 読み直しを始めると pending に戻り、その失敗は failed として届く
    act(() => void useDisplaySettingsStore.persist.rehydrate());
    expect(result.current).toBe("pending");
    await act(async () => {
      pending[2]?.reject(new Error("latest failed"));
    });
    expect(result.current).toBe("failed");
  });
});
