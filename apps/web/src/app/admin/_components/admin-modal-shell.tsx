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
 * `rounded-xl` / `shadow-xl` がユーザー向けの骨格（太い角丸・ハードシャドウ）を
 * 引いてしまう。
 */
export function AdminModalShell(
  props: Omit<ComponentProps<typeof ModalShell>, "panelClassName" | "skin">,
) {
  return (
    <ModalShell
      {...props}
      skin="plain"
      panelClassName="rounded-xl bg-white p-6 shadow-xl"
    />
  );
}
