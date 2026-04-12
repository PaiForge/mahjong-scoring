import type { ComponentProps } from "react";
import Link from "next/link";

/**
 * プライマリカラーの Link ボタン。
 * 共通スタイル（bg-primary-500 / hover:bg-primary-600）を統一する。
 * プライマリリンクボタン
 */
export function PrimaryLinkButton({
  className,
  ...props
}: Readonly<ComponentProps<typeof Link>>) {
  return (
    <Link
      className={`inline-flex items-center justify-center rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 ${className ?? ""}`}
      {...props}
    />
  );
}
