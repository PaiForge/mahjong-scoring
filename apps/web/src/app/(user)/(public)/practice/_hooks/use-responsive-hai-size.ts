"use client";

import { useState, useEffect, useCallback } from "react";
import type { HaiSize } from "@pai-forge/mahjong-react-ui";

/**
 * 画面幅に応じて牌のサイズを返すフック
 * 牌レスポンシブサイズ
 */
export function useResponsiveHaiSize(): HaiSize {
  const getSize = useCallback((): HaiSize => {
    if (typeof window === "undefined") return "sm";
    const width = window.innerWidth;
    if (width < 500) return "xs";
    return "sm";
  }, []);

  const [size, setSize] = useState<HaiSize>(getSize);

  useEffect(() => {
    const updateSize = () => setSize(getSize());
    updateSize();
    window.addEventListener("resize", updateSize);
    window.addEventListener("orientationchange", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
      window.removeEventListener("orientationchange", updateSize);
    };
  }, [getSize]);

  return size;
}
