// 型だけを読む。このモジュールは web のスクリプト（db:seed。CJS で走る）からも
// 読まれ、core を実行時に辿ると ESM 専用の riichi-mahjong で落ちるため。
// 応答の検証（core を実行時に使う）は `parse-native-ads-response.ts` に分ける
import type { HaiKindId } from "@mahjong-scoring/core";

/**
 * ネイティブ広告の形。周りに溶け込む相手の形の数だけある
 * （web の `lib/ads/registry.ts` の TSDoc 参照）
 * 広告の形
 *
 * - `native_card` — 練習カードと同じ形
 * - `native_row` — 行リンクと同じ形
 */
export const AD_KINDS = ["native_card", "native_row"] as const;

/** 広告の形 */
export type AdKind = (typeof AD_KINDS)[number];

/**
 * 画面に渡す広告 1 件。文言は閲覧者のロケールで解決済み
 * 広告ビュー
 *
 * web はサーバーコンポーネントからそのまま描画に渡し、モバイルは
 * 広告配信 API（{@link nativeAdsApiPath}）の JSON で受け取る。
 */
export interface NativeAdView {
  readonly id: string;
  readonly kind: AdKind;
  readonly href: string;
  /** 絵文字。画像が無いときの見た目 */
  readonly icon: string | undefined;
  /** 画像の公開 URL（Supabase Storage の絶対 URL） */
  readonly imageUrl: string | undefined;
  /** 画像の代替テキスト。画像が無ければ空 */
  readonly imageAlt: string;
  /**
   * カードの帯に並べる手牌。持たなければ undefined。読めない表記も
   * undefined にする（管理画面で検証済みのため、手で書かれた行だけ）
   */
  readonly hand: readonly HaiKindId[] | undefined;
  readonly title: string;
  readonly description: string | undefined;
}

/**
 * 広告配信 API の応答
 * 広告配信応答
 */
export interface NativeAdsResponse {
  readonly ads: readonly NativeAdView[];
}

/**
 * モバイルの練習一覧に出す広告のスロット
 * モバイル練習一覧広告スロット
 *
 * web の練習一覧（`practice-grid-native-ad`）とは分ける。Amazon アソシエイトは
 * 成果を分ける単位がリンクのトラッキング ID だけなので、スロットを共有すると
 * アプリと web の成果を後から分けられない。web のスロット定義（`AD_SLOTS`）は
 * この定数をキーに使い、両者の綴りを 1 か所に保つ。
 */
export const MOBILE_PRACTICE_GRID_AD_SLOT = "mobile-practice-grid-native-ad";

/**
 * 広告配信 API のパス（サイトの origin からの相対）
 * 広告配信APIパス
 */
export function nativeAdsApiPath(slot: string): string {
  return `/api/ads/${encodeURIComponent(slot)}`;
}
