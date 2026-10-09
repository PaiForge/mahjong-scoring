"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { useDeferredPrefetch } from "@/app/_hooks/use-deferred-prefetch";

/**
 * ページの読み込みが落ち着くまで先読みしない `<Link>`。
 *
 * ヘッダー・タブバーのように、どのページでも開いた瞬間から画面にある常設の
 * リンクに使う。本文の主導線（ヒーローの CTA 等）は素の `<Link>` のまま
 * すぐ先読みさせる。理由と解禁のタイミングは `useDeferredPrefetch` を参照。
 */
export function DeferredPrefetchLink({
  prefetch,
  ...props
}: ComponentProps<typeof Link>) {
  const canPrefetch = useDeferredPrefetch();
  return <Link {...props} prefetch={canPrefetch ? prefetch : false} />;
}
