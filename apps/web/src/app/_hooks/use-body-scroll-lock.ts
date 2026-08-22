"use client";

import { useEffect } from "react";

/**
 * 背面（body）のスクロールをロックする
 * 背面スクロールロック
 *
 * モーダル・ドロワーのように画面を覆う UI で使う。`document.body` という
 * グローバルな DOM 状態を触るため、解除漏れがそのままバグになる。
 * 各所で effect を書き直さず必ずこのフックを通すこと。
 *
 * @param isLocked - ロックするかどうか（false / アンマウントで元に戻す）
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLocked]);
}
