import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "./_lib/button-classes";
import { LinkPending } from "./link-pending";

interface LinkButtonProps extends ComponentProps<typeof Link> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** 親要素の幅いっぱいに広げる */
  readonly fullWidth?: boolean;
  /**
   * ラベルの右端に置くアイコン（チェブロン等）。
   * 遷移待ち中はこのスロット自体がスピナーへ差し替わる。
   */
  readonly trailingIcon?: ReactNode;
  /**
   * 遷移できない状態。
   *
   * リンクではなく `aria-disabled` を付けた `<span>` を描画する
   * （href を残したまま無効に見せると押せてしまうため）。
   */
  readonly disabled?: boolean;
}

/**
 * リンクのボタン
 *
 * 見た目は `Button` と共通（`buttonClasses`）で、要素だけが `next/link`。
 * クリック後の遷移待ち中はラベル右にスピナーを表示する。
 */
export function LinkButton({
  variant,
  size,
  fullWidth,
  disabled = false,
  className,
  children,
  trailingIcon,
  ...props
}: Readonly<LinkButtonProps>) {
  const classes =
    `${buttonClasses({ variant, size, fullWidth, disabled })} ${className ?? ""}`.trim();

  if (disabled) {
    return (
      <span aria-disabled="true" className={classes}>
        {children}
        {trailingIcon ? (
          <span className="flex size-5 shrink-0 items-center justify-center">
            {trailingIcon}
          </span>
        ) : undefined}
      </span>
    );
  }

  return (
    <Link className={classes} {...props}>
      {children}
      {trailingIcon ? (
        <span className="flex size-5 shrink-0 items-center justify-center">
          {/* スピナーの色は border-current 経由でボタンの文字色を継ぐ */}
          <LinkPending spinnerClassName="size-4">{trailingIcon}</LinkPending>
        </span>
      ) : (
        <LinkPending spinnerClassName="ml-2 size-4" />
      )}
    </Link>
  );
}
