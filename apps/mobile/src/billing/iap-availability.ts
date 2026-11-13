import { Platform } from "react-native";

import { resolveIapStoreKind, type IapStoreKind } from "./iap-store-kind";

/**
 * このビルドが Pro の購入に使うストア
 * 購入ストア
 *
 * iOS は App Store、Android は開発ビルドで `EXPO_PUBLIC_IAP_STORE=fake` を
 * 求めたときだけ偽ストア、それ以外は無し（規則と理由は {@link resolveIapStoreKind}）。
 * 購入の入口（`iap.ts`）がこれでアダプタを選ぶ。画面は {@link IAP_AVAILABLE} だけを
 * 見る — ストアの種類で出し分けるのは、App Store 固有の案内（返金・請求・領収書）を
 * 出すプラン画面だけ。
 */
export const IAP_STORE: IapStoreKind = resolveIapStoreKind({
  os: Platform.OS,
  isDev: __DEV__,
  requested: process.env.EXPO_PUBLIC_IAP_STORE,
});

/**
 * アプリ内課金（Pro の購入・表示・回数制限）を出すか
 * アプリ内課金の可否
 *
 * iOS は出す。ストアに出す Android のビルドは Pro を扱わない（購入・表示・
 * 回数制限のどれも出さない）。開発ビルドで偽ストアを選んだときだけ出す。
 * Play の決済ポリシーは外で買った権利を有効にすることを禁じていないが、
 * Play Billing の本物の実装はまだ無い。ストアの有無による分岐はこの定数に集め、
 * 画面側で `Platform.OS` を直接見ない。通知（マイページの「通知」）もこれで
 * 出し分ける — 種別がすべて Pro の出来事なので、Pro を出さないビルドには中身が無い。
 */
export const IAP_AVAILABLE = IAP_STORE !== "none";
