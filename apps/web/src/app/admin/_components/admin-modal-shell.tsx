"use client";

import type { ComponentProps } from "react";

import { ModalShell } from "@/app/_components/modal-shell";

/**
 * 管理画面用モーダルシェル
 * 管理モーダルシェル
 *
 * 挙動（オーバーレイ・Escape・スクロールロック）は共通の ModalShell に任せ、
 * パネルの体裁だけを管理画面のもの（細い角丸＋ぼかし影）に固定する。
 *
 * `skin="plain"` を渡すのは、ModalShell が body へポータルする＝管理画面の
 * ルートに付いた `data-skin="plain"` の配下から抜けるため。渡さないと
 * `rounded-xl` がユーザー向けの骨格（大きな角丸）を引いてしまう。
 */
/**
 * パネルの組み方
 *
 * - `padded` — 全体に余白を持つ 1 枚の箱。確認だけの短いモーダル向け
 * - `sectioned` — 余白を持たない箱。中身が見出し・本文・操作の段を自分で区切り、
 *   本文だけをスクロールさせる（入力欄が多く画面の高さを超えうるモーダル向け）
 */
type AdminModalLayout = "padded" | "sectioned";

const PANEL_CLASSES: Readonly<Record<AdminModalLayout, string>> = {
  padded: "space-y-6 rounded-xl bg-white p-6 shadow-xl",
  // 上下 1rem ずつを残して画面に収め、はみ出す分は本文の段（overflow-y-auto）が受ける
  sectioned:
    "flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-xl bg-white shadow-xl",
};

export function AdminModalShell({
  layout = "padded",
  ...props
}: Omit<ComponentProps<typeof ModalShell>, "panelClassName" | "skin"> & {
  readonly layout?: AdminModalLayout;
}) {
  return (
    <ModalShell
      {...props}
      skin="plain"
      panelClassName={PANEL_CLASSES[layout]}
    />
  );
}
