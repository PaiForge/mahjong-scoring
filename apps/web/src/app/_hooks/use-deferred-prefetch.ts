"use client";

import { useSyncExternalStore } from "react";

import { isPageIdle, whenPageIdle } from "@/app/_lib/page-idle";

/**
 * 常設のナビゲーション（タブバー・ヘッダー）の `<Link>` に先読みを許すかどうか。
 *
 * `<Link>` は画面に入った時点で遷移先を先読みする。タブバー・ヘッダーのリンクは
 * ページを開いた瞬間から画面にあるので、初回ロードの最中に十数本の RSC の
 * 取得が本文の描画と並んで走っていた（2026-10 に PageSpeed Insights で実測）。
 * ページの読み込みが落ち着くまで（`whenPageIdle`）`prefetch={false}` にしておき、
 * そこで先読みを解禁する。`<Link>` は `prefetch` が変わると先読みを登録し直す。
 *
 * 一度解禁したらページの寿命の間はそのまま（クライアント遷移のたびに
 * 待ち直さない）。サーバーとハイドレーション時は false。
 *
 * `<Link prefetch={canPrefetch ? undefined : false}>` のように使う。
 */
export function useDeferredPrefetch(): boolean {
  return useSyncExternalStore(whenPageIdle, isPageIdle, () => false);
}
