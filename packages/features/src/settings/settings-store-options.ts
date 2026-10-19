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
 *
 * @design 保存値の版は持たず、移行もしない
 * どのストアも persist の `version`（既定の 0）のままで、`migrate` を書かない。
 * 項目を足すときは既定値を書くだけでよい — 永続値を初期 state へ浅くマージ
 * するので、保存値に無い項目は既定値で補われる。項目の意味や型を変える
 * ときは項目のキー名か保存名を変え、古い保存値は読まずに捨てる。版と移行の
 * 分岐は、読む人に「どの版の値が来るか」を考えさせ、項目を足すたびに
 * 「版を上げるべきか」の判断を生むため持たない（端末ローカルの設定で、
 * 失っても困るのは好みの再設定だけ）。
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
