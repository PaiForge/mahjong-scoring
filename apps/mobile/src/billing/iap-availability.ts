import { Platform } from "react-native";

/**
 * アプリ内課金（Pro の購入・表示・回数制限）を出すか。iOS だけ
 * アプリ内課金の可否
 *
 * Android は Pro を扱わない（購入・表示・回数制限のどれも出さない）。Play の
 * 決済ポリシーは外で買った権利を有効にすることを禁じていないが、Play Billing の
 * 実装は別の仕事。iOS 限定の分岐はこの定数に集め、画面側で `Platform.OS` を
 * 直接見ない。通知（マイページの「通知」）もこれで出し分ける — 種別がすべて
 * Pro の出来事なので、Pro を出さない Android には中身が無い。
 */
export const IAP_AVAILABLE = Platform.OS === "ios";
