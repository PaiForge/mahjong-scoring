import type { NativeStackNavigationOptions } from "expo-router/native-stack";

import { colors } from "./theme";

/**
 * 小さい見出し（ヘッダー中央）の文字
 *
 * `Stack.Title` は渡されたスタイルで `headerTitleStyle` を丸ごと置き換えるので、
 * `Screen` も同じ値を渡す（渡さないと OS の既定の文字に戻る）。
 */
export const HEADER_TITLE_STYLE = {
  fontSize: 17,
  fontWeight: "700",
  color: colors.foreground,
} as const;

/**
 * タブの入口の見出し（ヘッダーの行の左端）の文字
 *
 * 奥の画面の中央の見出し（17pt）より一回り大きく、ヘッダーの 1 行（44pt）に
 * 収まる大きさ。置き方は `Screen` の TSDoc「見出しの位置」。
 */
export const HEADER_TAB_TITLE_STYLE = {
  fontSize: 22,
  fontWeight: "700",
  color: colors.foreground,
} as const;

/**
 * ネイティブスタックの共通の screenOptions
 * スタックの既定
 *
 * ルートのスタック（`app/_layout.tsx`）とタブごとのスタック
 * （`app/(tabs)/<タブ>/_layout.tsx`）が同じものを使う。
 *
 * - 地の色は白（`colors.card`）。画面の切り替えの間に OS の既定の地が見えない
 * - ヘッダーの文字と OS の戻る（`<`）は墨（`colors.foreground`）。アクセントの
 *   緑は押して始める面の記号なので、ヘッダーの操作には使わない
 * - 戻るは記号だけ（`minimal`）。前の画面の見出しを横に出すと、日本語の長い
 *   見出しが中央の見出しを押し出す
 * - 戻るの長押しで履歴（OS 標準の menu）。前の画面の見出しが並ぶ
 * - `title` の既定は空。expo-router はルート名（`practice/[slug]/play` 等）を
 *   見出しに出すので、`Screen` を描く前（読み込み中）にそれが見えないようにする
 *
 * 見出し・透け・右のボタンは各画面が `Screen` で載せる（ここでは決めない）。
 */
export const stackScreenOptions: NativeStackNavigationOptions = {
  title: "",
  contentStyle: { backgroundColor: colors.card },
  headerTintColor: colors.foreground,
  headerTitleStyle: HEADER_TITLE_STYLE,
  headerBackButtonDisplayMode: "minimal",
  headerBackButtonMenuEnabled: true,
};
