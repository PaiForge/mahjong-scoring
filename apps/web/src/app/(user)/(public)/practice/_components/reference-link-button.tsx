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
   * タップ領域の取り方（既定 `text`）
   *
   * - `text` — 文字の高さぶんだけ。答え合わせの表の中で値の直下に添える
   *   ときの姿で、表の行間を広げない
   * - `row` — `min-h-11`（44px）で 1 行ぶんの領域を確保する。盤面の末尾や
   *   結果一覧のように、リンクが表の外で 1 行を占め、直下に「次の問題へ」
   *   などの大きなボタンが続く場所で使う。文字の高さ（16px）だけを
   *   当たり判定にすると、外れた指がそのままボタンに吸われて内訳を読めなく
   *   なる。見た目は文字と下線のままで、広がるのは押せる範囲だけ
   *   （{@link import("./practice-footer-actions").PracticeFooterAction} と
   *   同じ約束）
   */
  readonly hitArea?: "text" | "row";
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
  hitArea = "text",
  ...buttonProps
}: ReferenceLinkButtonProps) {
  const hitAreaClass = hitArea === "row" ? " min-h-11" : "";

  return (
    <button
      type="button"
      {...buttonProps}
      className={`inline-flex items-center gap-1 text-xs ${TEXT_LINK_CLASSES}${hitAreaClass}`}
    >
      {icon}
      {label}
    </button>
  );
}
