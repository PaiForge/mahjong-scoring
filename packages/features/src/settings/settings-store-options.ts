import type { StateStorage } from "zustand/middleware";

/**
 * 永続値を描画に使ってよいかを決めるフック
 * ハイドレーションガード
 *
 * サーバーで描画するプラットフォーム（web）は、サーバーの HTML が常に既定値で
 * 描かれるため、ハイドレーションが終わるまで既定値（`fallback`）を返して
 * 初回のクライアント描画をサーバーの HTML と揃える必要がある。サーバー描画の
 * 無いプラットフォーム（モバイル）は値をそのまま返せばよい。
 */
export type HydrationGuard = <T>(value: T, fallback: T) => T;

/**
 * 端末ローカル設定ストアの生成オプション
 * 設定ストア生成オプション
 *
 * 設定ストア（ルール・トレーニング・表示・役の並び・点数練習）は
 * プラットフォームごとに保存先と描画の仕方が違う。ストアの中身（項目と
 * 既定値・保存名）は共通にし、違う部分だけをここで受ける。
 */
export interface SettingsStoreOptions {
  /**
   * 保存先を返す関数
   *
   * web は `() => localStorage`、モバイルは `() => AsyncStorage`。関数で
   * 受けるのは、サーバー上で `localStorage` を参照した時点で落ちないよう、
   * 実際に読み書きするまで評価を遅らせるため（zustand の
   * `createJSONStorage` と同じ契約）。
   */
  readonly storage: () => StateStorage;
  /** 永続値を描画に使ってよいかの判定。省略すると永続値をそのまま返す */
  readonly useHydrated?: HydrationGuard;
}

/**
 * 永続値をそのまま返すハイドレーションガード（サーバー描画の無い環境用）
 * 素通しガード
 */
export const passThroughHydration: HydrationGuard = (value) => value;
