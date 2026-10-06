import type { ReactNode } from "react";
import { IntlProvider } from "use-intl";
import { messages } from "@mahjong-scoring/messages/ja";

/** UI のロケール（web と同じく日本語固定） */
const LOCALE = "ja";

/** 日時の書式に使うタイムゾーン（記録の日付は日本時間で数える） */
const TIME_ZONE = "Asia/Tokyo";

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
    <IntlProvider locale={LOCALE} timeZone={TIME_ZONE} messages={messages}>
      {children}
    </IntlProvider>
  );
}
