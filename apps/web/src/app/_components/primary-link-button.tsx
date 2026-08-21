import type { ComponentProps } from "react";
import Link from "next/link";

import { LinkPending } from "./link-pending";

/**
 * プライマリカラーの Link ボタン。
 * 共通スタイル（太枠＋オフセット影＋押し込み演出）を統一する。
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
      className={`press-sm inline-flex items-center justify-center rounded-lg border-3 border-ink bg-primary-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-600 ${className ?? ""}`}
      {...props}
    >
      {children}
      <LinkPending spinnerClassName="ml-2 size-4 text-white" />
    </Link>
  );
}
