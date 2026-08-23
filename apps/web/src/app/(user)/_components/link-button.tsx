import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

import {
  BUTTON_CONTENT_CLASSES,
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "./_lib/button-classes";
import { LinkPending, LinkPendingOverlay } from "./link-pending";

interface LinkButtonProps extends ComponentProps<typeof Link> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** 親要素の幅いっぱいに広げる */
  readonly fullWidth?: boolean;
  /**
   * ラベルの右端に置くアイコン（チェブロン等）。
   * 遷移待ち中はこのスロット自体がスピナーへ差し替わる。
   *
   * 指定しない場合、遷移待ち中は中身を隠してボタン中央にスピナーを出す。
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
 * クリック後の遷移待ち中はボタン中央にスピナーを表示する
 * （`trailingIcon` があるときはそのスロットを差し替える）。
 *
 * アイコン + ラベルの間隔はコンポーネント側が持つため、
 * 呼び出し側の `className` に `gap-*` を書かない。
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
        <span className={BUTTON_CONTENT_CLASSES}>{children}</span>
        {trailingIcon ? (
          <span className="flex size-5 shrink-0 items-center justify-center">
            {trailingIcon}
          </span>
        ) : undefined}
      </span>
    );
  }

  if (trailingIcon) {
    return (
      <Link className={classes} {...props}>
        {children}
        <span className="flex size-5 shrink-0 items-center justify-center">
          {/* スピナーの色は border-current 経由でボタンの文字色を継ぐ */}
          <LinkPending spinnerClassName="size-4">{trailingIcon}</LinkPending>
        </span>
      </Link>
    );
  }

  return (
    <Link className={`relative ${classes}`} {...props}>
      <LinkPendingOverlay>{children}</LinkPendingOverlay>
    </Link>
  );
}
