"use client";

import { useSyncExternalStore } from "react";

/**
 * 常設のナビゲーション（タブバー・ヘッダー）の `<Link>` に先読みを許すかどうか。
 *
 * `<Link>` は画面に入った時点で遷移先を先読みする。タブバー・ヘッダーのリンクは
 * ページを開いた瞬間から画面にあるので、初回ロードの最中に十数本の RSC の
 * 取得が本文の描画と並んで走っていた（2026-10 に PageSpeed Insights で実測）。
 * ページの `load` の後、ブラウザが手すきになるまで `prefetch={false}` にしておき、
 * そこで先読みを解禁する。`<Link>` は `prefetch` が変わると先読みを登録し直す。
 *
 * 一度解禁したらページの寿命の間はそのまま（クライアント遷移のたびに
 * 待ち直さない）。サーバーとハイドレーション時は false。
 */
let ready = false;
const listeners = new Set<() => void>();
let scheduled = false;

function markReady(): void {
  ready = true;
  for (const listener of listeners) {
    listener();
  }
}

function scheduleReady(): void {
  if (scheduled) {
    return;
  }
  scheduled = true;
  const onIdle = () => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(markReady, { timeout: 2000 });
    } else {
      window.setTimeout(markReady, 200);
    }
  };
  if (document.readyState === "complete") {
    onIdle();
  } else {
    window.addEventListener("load", onIdle, { once: true });
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  scheduleReady();
  return () => listeners.delete(listener);
}

/**
 * 先読みを解禁してよいか
 *
 * `<Link prefetch={canPrefetch ? undefined : false}>` のように使う。
 */
export function useDeferredPrefetch(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => ready,
    () => false,
  );
}
