import { messages } from "@mahjong-scoring/messages/ja";

import {
  getTranslations,
  useTranslations as useStubTranslations,
} from "@/test/intl-mock";

export { getTranslations };

/**
 * 牌画像（`LocaleHai`）が引く言語。共通のスタブと同じく常に日本語
 *
 * 共通のスタブの `useLocale` を re-export すると、`vi.mock` のファクトリ経由で
 * 読んだときに値が undefined になったため、ここで関数として持つ。
 */
export function useLocale(): string {
  return "ja";
}

/** 日本語の役名の辞書（キー → core の役名と同じ文字列） */
const JA_YAKU_NAMES: Readonly<Record<string, string>> = messages.yakuNames;

/**
 * 役名だけ日本語の辞書を引く next-intl のテスト用スタブ
 * 役名つきi18nモック
 *
 * 練習の内訳・役チップは core の役名（日本語）を `yakuNames` の辞書で引いて出す。
 * 共通のスタブ（`@/test/intl-mock`）はキーをそのまま返すので、役名が
 * `honitsu` のようなキーになり、「日本語の表示は core の役名のまま」という
 * 約束と役名で引くテストの両方が読めなくなる。`yakuNames` の名前空間だけ
 * 本物の日本語の辞書を引き、それ以外は共通のスタブと同じくキーを返す。
 *
 * ```ts
 * vi.mock("next-intl", async () => await import("../../_lib/yaku-names-intl-mock"));
 * ```
 *
 * このモジュールはテスト専用。
 */
export function useTranslations(
  namespace?: string,
): ReturnType<typeof useStubTranslations> {
  const stub = useStubTranslations();
  if (namespace !== "yakuNames") return stub;
  const lookup = (key: string) => JA_YAKU_NAMES[key] ?? key;
  return Object.assign(lookup, { rich: lookup });
}
