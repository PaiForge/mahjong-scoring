import type { ComponentProps } from "react";

import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "./_lib/button-classes";

interface ButtonProps extends ComponentProps<"button"> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** 親要素の幅いっぱいに広げる */
  readonly fullWidth?: boolean;
}

/**
 * 汎用ボタン
 *
 * 見た目は `buttonClasses` に集約している。`className` は余白などの
 * レイアウト調整用で、色・枠・影をここで上書きしない。
 *
 * `type` は既定で `"button"`。フォーム送信では `type="submit"` を明示する
 * （未指定の `<button>` が submit として振る舞う事故を防ぐ）。
 */
export function Button({
  variant,
  size,
  fullWidth,
  disabled,
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${buttonClasses({ variant, size, fullWidth, disabled })} ${className ?? ""}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
