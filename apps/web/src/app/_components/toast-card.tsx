"use client";

import { resolveValue, type Toast } from "react-hot-toast";

/**
 * トーストの見た目（種類ごとの配色とアイコン）
 * トーストカード
 *
 * react-hot-toast の既定の見た目（白い角丸にぼかし影）はこのアプリの
 * 骨格（太枠）から浮くため、
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

/**
 * 種類ごとのアイコンの図形（丸で囲った記号）
 *
 * 記号を文字（✓ / ✕ / ℹ）で置くと、フォントによっては囲みの丸が無い
 * ただの字形になり、アイコンに見えない（実機で "i" が裸で出ていた）。
 * 図形として持てば環境によらず同じ形になる。
 *
 * 線画アイコンの外殻は `(user)/_components/icons/OutlineIcon` にあるが、
 * このファイルは管理画面とも共有する `app/_components/` 側にあり、
 * 依存の向きを一方向に保つため import できない。体裁（24 のビューボックス・
 * 線幅 2・線端の丸め）は OutlineIcon に合わせて手で持つ。
 */
const TONE_ICON_PATHS: Partial<Record<Toast["type"], string>> = {
  // 丸 + チェック
  success: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M8 12.5l2.75 2.75L16 9.5",
  // 丸 + バツ
  error: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M9 9l6 6M15 9l-6 6",
  // 丸 + i（点と縦棒）
  blank: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 11v5.5M12 7.5v.01",
};

export function ToastCard({ toast }: { readonly toast: Toast }) {
  const iconPath = TONE_ICON_PATHS[toast.type];

  return (
    <div
      // 出入りは下からせり上がる。fixed 側が画面下端に置くため、
      // 消えるときも下へ引く（react-hot-toast は退出中も要素を残す）。
      className={`flex max-w-sm items-center gap-3 rounded-xl border-3 border-ink px-4 py-3 transition-all duration-200 ${
        toast.visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      } ${TONE_CLASSES[toast.type]}`}
      {...toast.ariaProps}
    >
      {iconPath && (
        <svg
          aria-hidden="true"
          className="size-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={iconPath} />
        </svg>
      )}
      <p className="text-sm font-bold">{resolveValue(toast.message, toast)}</p>
    </div>
  );
}
