import { useLocale } from "use-intl";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
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
 * 辞書の Provider（`AppIntlProvider`）の `locale` を use-intl の `useLocale()` で読み、
 * 対応言語に絞る。Provider が渡すのは端末の言語から起動時に決めた `APP_LOCALE`
 * なので実際には必ず対応言語で、`DEFAULT_LOCALE` に落ちるのは型を絞るためだけ。
 * Provider の外（ルートレイアウトの先頭で動く購入の同期等）では使えないので、
 * そこでは `lib/app-locale.ts` の `APP_LOCALE` を直接読む。
 */
export function useAppLocale(): SupportedLocale {
  const locale = useLocale();
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}
