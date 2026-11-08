import { vi } from "vitest";

/**
 * 言語と名前空間で辞書を引き分ける `next-intl/server` のテスト用スタブ
 * 言語別i18nモック
 *
 * metadata のヘルパーは `getTranslations({ locale, namespace })` で言語を明示して
 * 引く（リクエストのロケールに落とさない）。`@/test/intl-namespace-mock` は
 * 名前空間の文字列しか受け取らないので、言語ごとの出力を確かめる metadata の
 * テストはこちらを使う:
 *
 * ```ts
 * vi.mock("next-intl/server", async () => await import("./locale-intl-mock"));
 *
 * it("...", async () => {
 *   setupLocaleTranslations({ ja: { jantouFu: { title: "雀頭符" } } });
 * });
 * ```
 *
 * 辞書に無いキーは `?キー名` を返す（引くつもりのないキーを引いたことが出力に
 * 残るように）。`{name}` の補間だけを再現する。
 * `vi.clearAllMocks()` で実装が消えるので、各テストの中で設定すること。
 *
 * このモジュールはテスト専用。
 */

/** 言語 → 名前空間 → キー → 文言 */
export type LocaleDictionary = Record<
  string,
  Record<string, Record<string, string>>
>;

/** `next-intl/server` の `getTranslations` の差し替え先 */
export const mockGetTranslations = vi.fn();

/** `vi.mock("next-intl/server", ...)` 用のエイリアス */
export const getTranslations = mockGetTranslations;

/** `getTranslations({ locale, namespace })` の引数の形か */
function isLocaleNamespaceArg(
  arg: unknown,
): arg is { readonly locale: string; readonly namespace: string } {
  return (
    typeof arg === "object" &&
    arg !== null &&
    "locale" in arg &&
    typeof arg.locale === "string" &&
    "namespace" in arg &&
    typeof arg.namespace === "string"
  );
}

/**
 * 言語と名前空間ごとの辞書を引く翻訳関数を組み立てる
 * 言語別翻訳辞書設定
 *
 * 引数の形が `{ locale, namespace }` でない呼び出し（言語を明示しない
 * `getTranslations("ns")`）は例外にする。ヘルパーがリクエストのロケールへ
 * 落ちたことをテストで検出するため。
 *
 * @param dict - 言語 → 名前空間 → キー → 文言
 */
export function setupLocaleTranslations(dict: LocaleDictionary): void {
  mockGetTranslations.mockImplementation((arg: unknown) => {
    if (!isLocaleNamespaceArg(arg)) {
      throw new Error(
        `getTranslations は { locale, namespace } で呼ぶこと: ${JSON.stringify(arg)}`,
      );
    }
    const { locale, namespace } = arg;
    return Promise.resolve((key: string, values?: Record<string, unknown>) => {
      const message = dict[locale]?.[namespace]?.[key] ?? `?${key}`;
      if (!values) return message;
      return message.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in values ? String(values[name]) : match,
      );
    });
  });
}
