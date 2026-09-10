"use client";

import { useEffect, useRef, useState } from "react";

interface AutoScaleOptions {
  /**
   * 拡大の上限。既定は等倍。同じ盤面に並ぶ別の行と牌の大きさを揃えたい
   * 場合に、揃える相手の倍率を渡す
   */
  readonly maxScale?: number;
  /**
   * 基準にする内容の自然幅（px）。渡すと、この幅がラッパーに収まる倍率
   * （`referenceScale`）を別に返し、内容の倍率もそれを超えない。
   *
   * ラッパーの高さを内容ではなく幅から決めたいときに使う。内容の自然幅は
   * 中身（手牌なら鳴きの数と種類）で変わるため、「内容が収まる倍率 × 高さ」で
   * 高さを決めると中身ごとに高さが揺れる。基準幅から決めた倍率は幅の純関数
   * なので、同じ幅なら中身が何であれ同じ高さになる
   */
  readonly referenceWidth?: number;
}

/**
 * ラッパー幅に基づいてコンテンツを自動スケーリングする
 * 自動スケーリング
 *
 * @param deps - 再計測のトリガ（表示内容が変わる値を渡す）
 * @returns `scale` は内容に実際に掛けた倍率、`referenceScale` は基準幅が
 *   収まる倍率（`referenceWidth` を渡さなければ 1）
 */
export function useAutoScale(
  deps: readonly unknown[],
  { maxScale = 1, referenceWidth }: AutoScaleOptions = {},
) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [referenceScale, setReferenceScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const wrapper = wrapperRef.current;
      const content = contentRef.current;
      if (!wrapper || !content) return;
      // Reset scale to measure natural content width
      content.style.transform = "scale(1)";
      const naturalWidth = content.scrollWidth;
      const availableWidth = wrapper.clientWidth;
      const fitScale =
        naturalWidth > availableWidth ? availableWidth / naturalWidth : 1;
      const nextReferenceScale =
        referenceWidth === undefined
          ? 1
          : Math.min(1, availableWidth / referenceWidth);
      const newScale = Math.min(fitScale, maxScale, nextReferenceScale);
      content.style.transform = `scale(${newScale})`;
      setScale(newScale);
      setReferenceScale(nextReferenceScale);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, maxScale, referenceWidth]);

  return { wrapperRef, contentRef, scale, referenceScale };
}
