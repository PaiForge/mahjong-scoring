/**
 * next-intl のテスト用スタブ
 * i18nモック
 *
 * 「翻訳キーがそのまま出る」だけの中身のないスタブ。文言そのものを
 * 検証したいテストは無く（辞書の整合性は *-i18n-integrity.test.ts が担う）、
 * 各テストが同じ3行を書いていたのでここへまとめる。
 *
 * `next-intl` / `next-intl/server` のどちらのモックにも使える:
 *
 * ```ts
 * vi.mock("next-intl", async () => await import("@/test/intl-mock"));
 * vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));
 * ```
 *
 * 補間した値まで見たいテスト（`t(key, values)`）は独自のスタブを書くこと。
 *
 * このモジュールはテスト専用。
 */

/** クライアントコンポーネント用（キーをそのまま返す） */
export function useTranslations(): (key: string) => string {
  return (key) => key;
}

/** サーバーコンポーネント用（キーをそのまま返す） */
export function getTranslations(): Promise<(key: string) => string> {
  return Promise.resolve((key) => key);
}
