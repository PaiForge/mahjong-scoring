"use client";

import { useState, useEffect } from "react";
import type { HaiSize } from "@pai-forge/mahjong-react-ui";

const BREAKPOINT = "(min-width: 500px)";

/**
 * 画面幅に応じて牌のサイズを返すフック
 * 牌レスポンシブサイズ
 *
 * `window.matchMedia` を使用してブレークポイントの変更を監視する。
 * resize イベントのポーリングよりも効率的。
 */
export function useResponsiveHaiSize(): HaiSize {
  const [size, setSize] = useState<HaiSize>(() => {
    if (typeof window === "undefined") return "sm";
    return window.matchMedia(BREAKPOINT).matches ? "sm" : "xs";
  });

  useEffect(() => {
    const mql = window.matchMedia(BREAKPOINT);
    const handleChange = (e: MediaQueryListEvent) => {
      setSize(e.matches ? "sm" : "xs");
    };

    // 初回の同期
    setSize(mql.matches ? "sm" : "xs");

    mql.addEventListener("change", handleChange);
    return () => {
      mql.removeEventListener("change", handleChange);
    };
  }, []);

  return size;
}
