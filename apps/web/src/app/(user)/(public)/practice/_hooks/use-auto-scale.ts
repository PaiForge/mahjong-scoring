"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ラッパー幅に基づいてコンテンツを自動スケーリングする
 * 自動スケーリング
 */
export function useAutoScale(deps: readonly unknown[]) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const wrapper = wrapperRef.current;
      const content = contentRef.current;
      if (!wrapper || !content) return;
      // Reset scale to measure natural content width
      content.style.transform = "scale(1)";
      const naturalWidth = content.scrollWidth;
      const availableWidth = wrapper.clientWidth;
      const newScale = naturalWidth > availableWidth ? availableWidth / naturalWidth : 1;
      content.style.transform = `scale(${newScale})`;
      setScale(newScale);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { wrapperRef, contentRef, scale };
}
