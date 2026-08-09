import { useSyncExternalStore } from "react";

/** クライアント判定は外部変化を持たないため、購読は何もしない */
const subscribe = () => () => {};

const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * クライアントサイドレンダリング判定フック
 * クライアント判定
 *
 * SSR/CSR のハイドレーション不一致を防ぐために使用する。
 * サーバーでは `false`、ハイドレーション後のクライアントでは `true` を返す。
 *
 * @remarks
 * `useEffect` で `setState` する実装は追加のレンダーを挟むため、
 * サーバー・クライアントで異なるスナップショットを返せる
 * `useSyncExternalStore` を使用する。
 */
export function useIsClient() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
