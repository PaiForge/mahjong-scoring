import { vi } from "vitest";

/**
 * 名前空間ごとの辞書を差し込める next-intl のテスト用スタブ
 * i18n名前空間モック
 *
 * `getTranslations(namespace)` に渡された名前空間で辞書を引き分ける。
 * キーをそのまま返すだけの {@link "./intl-mock"} では足りないテスト —
 * メタデータのヘルパーのように「どの名前空間のどのキーを引いたか」で
 * 出力が変わるもの — が使う。
 *
 * この module の export はモック対象の形にも揃えてあるため、`vi.mock` の
 * ファクトリにそのまま渡せる:
 *
 * ```ts
 * vi.mock("next-intl/server", async () => await import("@/test/intl-namespace-mock"));
 *
 * beforeEach(() => {
 *   vi.clearAllMocks();
 * });
 *
 * it("...", async () => {
 *   setupTranslations({ jantouFu: { title: "雀頭符" } });
 * });
 * ```
 *
 * 辞書に無いキーは `?キー名` を返す。テストが引くつもりのないキーを引いた
 * ことが出力に残るようにするためで、空文字にすると欠落が消えてしまう。
 *
 * `setupTranslations` は `vi.clearAllMocks()` で消えるので、beforeEach で
 * クリアするなら各テストの中で呼ぶこと。
 *
 * このモジュールはテスト専用。
 */

/** `next-intl/server` の `getTranslations` の差し替え先 */
export const mockGetTranslations = vi.fn();

/** `vi.mock("next-intl/server", ...)` 用のエイリアス */
export const getTranslations = mockGetTranslations;

/**
 * 名前空間ごとの辞書を引く翻訳関数を組み立てる
 * 翻訳辞書設定
 *
 * @param dict - 名前空間 → キー → 文言
 */
export function setupTranslations(
  dict: Record<string, Record<string, string>>,
): void {
  mockGetTranslations.mockImplementation((namespace: string) =>
    Promise.resolve((key: string) => dict[namespace]?.[key] ?? `?${key}`),
  );
}
