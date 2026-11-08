import type { ReactNode } from "react";
import { IntlProvider } from "use-intl";
import { JST_TIME_ZONE } from "@mahjong-scoring/features/jst";

import { APP_LOCALE, APP_MESSAGES } from "./app-locale";

/**
 * 辞書の Provider
 * 辞書プロバイダ
 *
 * web（next-intl）と同じ辞書（`@mahjong-scoring/messages`）を use-intl で読む。
 * 辞書キーはレジストリと結び付いた契約（`practice.practices.<messageKey>` 等）
 * なので、モバイル用に辞書を分けない。
 *
 * 言語と辞書は、起動時に端末のアプリ優先言語から 1 回だけ決めた `APP_LOCALE` /
 * `APP_MESSAGES`（`lib/app-locale.ts`）。起動中に切り替えないので Provider は
 * 動的にしない。アプリ内の言語切替の設定も持たず、切り替えは iOS の
 * 「設定 > アプリ > 言語」に任せる（OS がアプリを再起動する）。
 *
 * 時刻の基準は言語に依らず JST（日付の境目・記録の日付は web と同じ日本時間）。
 */
export function AppIntlProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <IntlProvider
      locale={APP_LOCALE}
      timeZone={JST_TIME_ZONE}
      messages={APP_MESSAGES}
    >
      {children}
    </IntlProvider>
  );
}
