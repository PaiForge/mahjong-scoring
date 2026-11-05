import type { ReactNode } from "react";
import { IntlProvider } from "use-intl";
import { DEFAULT_LOCALE } from "@mahjong-scoring/features/i18n/locales";
import { JST_TIME_ZONE } from "@mahjong-scoring/features/jst";
import { messages } from "@mahjong-scoring/messages/ja";

/**
 * 辞書の Provider
 * 辞書プロバイダ
 *
 * web（next-intl）と同じ辞書（`@mahjong-scoring/messages`）を use-intl で読む。
 * 辞書キーはレジストリと結び付いた契約（`practice.practices.<messageKey>` 等）
 * なので、モバイル用に辞書を分けない。
 */
export function AppIntlProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <IntlProvider
      locale={DEFAULT_LOCALE}
      timeZone={JST_TIME_ZONE}
      messages={messages}
    >
      {children}
    </IntlProvider>
  );
}
