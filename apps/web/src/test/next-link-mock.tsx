import type { ComponentProps } from "react";

/**
 * `next/link` のテスト用スタブ
 * リンクモック
 *
 * App Router のコンテキストが無いテスト環境で、`Link` を素の `<a>` に置き換える。
 * `href` と `<a>` の属性（`className`・`aria-label`・`onClick` 等）は渡し、
 * Next だけが読む props（`prefetch` 等）は捨てる:
 *
 * ```ts
 * vi.mock("next/link", async () => await import("@/test/next-link-mock"));
 * ```
 *
 * このモジュールはテスト専用。
 */
export default function Link({
  href,
  prefetch: _prefetch,
  replace: _replace,
  scroll: _scroll,
  ...props
}: Omit<ComponentProps<"a">, "href"> & {
  readonly href: string;
  readonly prefetch?: boolean | null;
  readonly replace?: boolean;
  readonly scroll?: boolean;
}) {
  return <a href={href} {...props} />;
}

/** `LinkButton` の遷移待ちオーバーレイ（`LinkPendingOverlay`）が使う */
export function useLinkStatus(): { readonly pending: boolean } {
  return { pending: false };
}
