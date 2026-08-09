"use client";

import { useSyncExternalStore } from "react";
import type { HaiSize } from "@pai-forge/mahjong-react-ui";

const BREAKPOINT = "(min-width: 500px)";

function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(BREAKPOINT);
  mql.addEventListener("change", onStoreChange);
  return () => {
    mql.removeEventListener("change", onStoreChange);
  };
}

function getSnapshot(): HaiSize {
  return window.matchMedia(BREAKPOINT).matches ? "sm" : "xs";
}

function getServerSnapshot(): HaiSize {
  return "sm";
}

/**
 * 画面幅に応じて牌のサイズを返すフック
 * 牌レスポンシブサイズ
 *
 * `window.matchMedia` を使用してブレークポイントの変更を監視する。
 * resize イベントのポーリングよりも効率的。
 *
 * @remarks
 * スナップショットは文字列のため参照同一性の問題は起きない。
 * `useEffect` での初回同期が不要になり、余分なレンダーを挟まない。
 */
export function useResponsiveHaiSize(): HaiSize {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
