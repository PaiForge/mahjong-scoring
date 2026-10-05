import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { messages } from "@mahjong-scoring/messages/ja";
import { useYakuLabel } from "@mahjong-scoring/features/yaku/use-yaku-options";

/**
 * 共有の `useYakuLabel` は use-intl から辞書を読む。web の Provider
 * （next-intl の `NextIntlClientProvider`）の下でも同じ辞書を読めることを確かめる
 */
describe("useYakuLabel（next-intl の Provider の下）", () => {
  it("NextIntlClientProvider の辞書から表示名を引く", () => {
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <NextIntlClientProvider
        locale="ja"
        timeZone="Asia/Tokyo"
        messages={messages}
      >
        {children}
      </NextIntlClientProvider>
    );
    const { result } = renderHook(() => useYakuLabel(), { wrapper });
    expect(result.current("断么九")).toBe(messages.score.yaku.tanyao);
  });
});
