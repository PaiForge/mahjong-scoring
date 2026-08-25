"use client";

import { resolveValue, type Toast } from "react-hot-toast";

/**
 * トーストの見た目（種類ごとの配色とアイコン）
 * トーストカード
 *
 * react-hot-toast の既定の見た目（白い角丸にぼかし影）はこのアプリの
 * 骨格（太枠・ぼかしのない濃色オフセット影）から浮くため、
 * {@link import("./global-toaster").GlobalToaster} が全トーストを
 * これに差し替えて描く。
 *
 * 配色は状態色トークン（success / destructive / warning）をそのまま引く。
 * 意味を持つ色なので green-* / red-* のような素の色は使わない。
 */
const TONE_CLASSES: Record<Toast["type"], string> = {
  success: "bg-success text-success-foreground",
  error: "bg-destructive text-destructive-foreground",
  loading: "bg-card text-foreground",
  blank: "bg-card text-foreground",
  custom: "bg-card text-foreground",
};

/** 種類ごとの記号。線画アイコンを起こすほどの情報量ではないため文字で置く */
const TONE_ICONS: Partial<Record<Toast["type"], string>> = {
  success: "✓",
  error: "✕",
  blank: "ℹ",
};

export function ToastCard({ toast }: { readonly toast: Toast }) {
  const icon = TONE_ICONS[toast.type];

  return (
    <div
      // 出入りは下からせり上がる。fixed 側が画面下端に置くため、
      // 消えるときも下へ引く（react-hot-toast は退出中も要素を残す）。
      className={`flex max-w-sm items-center gap-3 rounded-xl border-3 border-ink px-4 py-3 shadow-md transition-all duration-200 ${
        toast.visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      } ${TONE_CLASSES[toast.type]}`}
      {...toast.ariaProps}
    >
      {icon && (
        <span aria-hidden="true" className="text-lg leading-none">
          {icon}
        </span>
      )}
      <p className="text-sm font-bold">{resolveValue(toast.message, toast)}</p>
    </div>
  );
}
