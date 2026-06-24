import type { ComponentProps } from "react";
import Link from "next/link";

import { LinkPending } from "./link-pending";

/**
 * プライマリカラーの Link ボタン。
 * 共通スタイル（bg-primary-500 / hover:bg-primary-600）を統一する。
 * クリック後の遷移待ち中はラベル右にスピナーを表示する。
 * プライマリリンクボタン
 */
export function PrimaryLinkButton({
  className,
  children,
  ...props
}: Readonly<ComponentProps<typeof Link>>) {
  return (
    <Link
      className={`inline-flex items-center justify-center rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 ${className ?? ""}`}
      {...props}
    >
      {children}
      <LinkPending spinnerClassName="ml-2 size-4 text-white" />
    </Link>
  );
}
