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
 * モバイル（Expo）の画面が読む広告のスロット。キーは画面での呼び名、値は
 * スロットの綴り（DB の `slot`・広告配信 API のパス）
 * モバイル広告スロット
 *
 * web の同じ画面のスロットとは分ける。Amazon アソシエイトは成果を分ける
 * 単位がリンクのトラッキング ID だけなので、スロットを共有するとアプリと web の
 * 成果を後から分けられない。web のスロット定義（`AD_SLOTS`）はこの値を
 * キーに使い、両者の綴りを 1 か所に保つ。形（kind）と枠数は web の同じ画面の
 * スロットに合わせる。
 */
export const MOBILE_AD_SLOTS = {
  practiceGrid: "mobile-practice-grid-native-ad",
  practiceIntro: "mobile-practice-intro-native-ad",
  practiceResult: "mobile-practice-result-native-ad",
  examIntro: "mobile-exam-intro-native-ad",
  examResult: "mobile-exam-result-native-ad",
  rankDetail: "mobile-rank-detail-native-ad",
  learnIndex: "mobile-learn-index-native-ad",
  learnChapter: "mobile-learn-chapter-native-ad",
  lessonPractices: "mobile-lesson-practices-native-ad",
  glossaryIndex: "mobile-glossary-index-native-ad",
  glossaryTerm: "mobile-glossary-term-native-ad",
  yakuReference: "mobile-yaku-reference-native-ad",
  announcementsIndex: "mobile-announcements-index-native-ad",
} as const;

/** モバイル広告スロット */
export type MobileAdSlot =
  (typeof MOBILE_AD_SLOTS)[keyof typeof MOBILE_AD_SLOTS];

/**
 * 広告配信 API のパス（サイトの origin からの相対）
 * 広告配信APIパス
 */
export function nativeAdsApiPath(slot: string): string {
  return `/api/ads/${encodeURIComponent(slot)}`;
}
