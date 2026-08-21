import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

import { LinkPending } from "./link-pending";

interface PrimaryLinkButtonProps extends ComponentProps<typeof Link> {
  /**
   * ラベルの右端に置くアイコン（チェブロン等）。
   * 遷移待ち中はこのスロット自体がスピナーへ差し替わる。
   */
  readonly trailingIcon?: ReactNode;
}

/**
 * プライマリカラーの Link ボタン。
 * 共通スタイル（太枠＋オフセット影＋押し込み演出）を統一する。
 * クリック後の遷移待ち中はラベル右にスピナーを表示する。
 * プライマリリンクボタン
 */
export function PrimaryLinkButton({
  className,
  children,
  trailingIcon,
  ...props
}: Readonly<PrimaryLinkButtonProps>) {
  return (
    <Link
      className={`press-sm inline-flex items-center justify-center rounded-lg border-3 border-ink bg-primary-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-600 ${className ?? ""}`}
      {...props}
    >
      {children}
      {trailingIcon ? (
        <span className="flex size-5 shrink-0 items-center justify-center">
          <LinkPending spinnerClassName="size-4 text-white">
            {trailingIcon}
          </LinkPending>
        </span>
      ) : (
        <LinkPending spinnerClassName="ml-2 size-4 text-white" />
      )}
    </Link>
  );
}
