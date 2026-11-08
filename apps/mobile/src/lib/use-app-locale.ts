import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/**
 * アプリが表示に使う言語
 * アプリの言語
 *
 * 日付の書式・一覧の区切り・web を開くリンクの接頭辞・牌の読み上げなど、
 * 言語に依る表示はすべてこのフックで言語を取り、文字列や既定値を画面ごとに
 * 決めない。
 *
 * 暫定版: 常に `DEFAULT_LOCALE`（日本語）を返す。言語の解決のタスク（T1）が
 * use-intl の `useLocale()` を `isSupportedLocale` で絞る実装に置き換える
 * （辞書の Provider が端末の言語から決めた値を渡すので、実際には必ず対応言語）。
 */
export function useAppLocale(): SupportedLocale {
  return DEFAULT_LOCALE;
}
