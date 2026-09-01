"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * 画面を覆う UI（モーダル・ドロワー）が今いくつ開いているか。
 *
 * 数で持つのは、入れ子で開いたときに内側を閉じただけで外側のロックまで
 * 解けてしまうのを避けるため。
 */
let openCount = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  for (const listener of listeners) listener();
}

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

    openCount += 1;
    document.body.style.overflow = "hidden";
    notify();
    return () => {
      openCount -= 1;
      if (openCount === 0) document.body.style.overflow = "";
      notify();
    };
  }, [isLocked]);
}

/**
 * 画面を覆う UI が開いているか
 * オーバーレイ開閉判定
 *
 * オーバーレイの背面に居残ると具合が悪いもの（固定タブバーなど）が、
 * 自分を引っ込めるために使う。オーバーレイは半透明なので、下に不透明な
 * ものが残っていると薄まった帯として透け、覆えていないように見える。
 *
 * サーバーでは常に false（オーバーレイは操作の結果でしか開かない）。
 */
export function useIsOverlayOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => openCount > 0,
    () => false,
  );
}
