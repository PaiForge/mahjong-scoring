import {
  render as renderWithoutIntl,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";

import { messages } from "@mahjong-scoring/messages/ja";

function JaIntlProvider({ children }: { readonly children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="ja" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

/**
 * 辞書を引くコンポーネントのテスト用 `render`
 * 辞書付きレンダー
 *
 * `next-intl` をモックせず、本番と同じ日本語の辞書で文言まで確かめたい
 * テストで使う。`@testing-library/react` の `render` と同じ引数で、
 * `import { render } from "@/test/intl-render"` に差し替えるだけでよい。
 * 辞書を差し替えたいテストは `NextIntlClientProvider` を直接書く。
 *
 * このモジュールはテスト専用。
 */
export function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult {
  return renderWithoutIntl(ui, { ...options, wrapper: JaIntlProvider });
}
