import { createElement, type ReactNode } from "react";
import { IntlProvider } from "use-intl";
import { messages } from "@mahjong-scoring/messages/ja";

/**
 * 日本語の辞書を渡した `IntlProvider`
 * 辞書ラッパー
 *
 * 辞書を引くフックのテストで `renderHook(..., { wrapper: IntlWrapper })` に渡す。
 * アプリと同じ辞書・ロケール・タイムゾーンで引く。
 */
export function IntlWrapper({ children }: { readonly children: ReactNode }) {
  return createElement(IntlProvider, {
    locale: "ja",
    timeZone: "Asia/Tokyo",
    messages,
    children,
  });
}
