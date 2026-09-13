"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

interface ReferenceLinkButtonProps extends Pick<
  ComponentPropsWithoutRef<"button">,
  "onClick" | "title" | "aria-expanded" | "aria-controls"
> {
  /**
   * 先頭に置くアイコン。押すと何が起きるかをアイコンで言い分ける
   * （表のアイコンなら早見表が開く、▶ ならその場で展開する）
   */
  readonly icon: ReactNode;
  readonly label: string;
  /**
   * 文字の後ろに添えるもの（面子分解の和了牌など）。同じ文字のリンクが
   * 並ぶときに、どれを指すかを言い分けるために使う
   */
  readonly trailing?: ReactNode;
}

/**
 * 答え合わせに添える補助リンク
 * 補助リンク
 *
 * 答えの値を読み終えた人が、確かめたいときだけ押す導線（早見表を開く・
 * 内訳を展開する）。主役の値より小さく、テキストリンクの灰色の下線で
 * 「押せる」を常時見せる。値の下・右端に置く前提で、幅は文字ぶんだけ持つ。
 *
 * 早見表を開くリンクも内訳を開くボタンも同じ姿にする。見た目で動作を
 * 分けず、先頭のアイコンだけで行き先を言い分ける（文字の太さや色で分けると、
 * 表の中に「見出しにも値にも見えない文字」が混ざり、押せることが伝わらない）。
 */
export function ReferenceLinkButton({
  icon,
  label,
  trailing,
  ...buttonProps
}: ReferenceLinkButtonProps) {
  return (
    <button
      type="button"
      {...buttonProps}
      className={`inline-flex items-center gap-1 text-xs ${TEXT_LINK_CLASSES}`}
    >
      {icon}
      {label}
      {trailing}
    </button>
  );
}
