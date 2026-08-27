"use client";

import type { ReactNode } from "react";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

interface ReferenceLinkButtonProps {
  /** 参照先のナビと同じアイコン（行き先が一目で分かるようにする） */
  readonly icon: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
}

/**
 * 早見表を開く補助リンク
 * 早見表リンク
 *
 * 答え合わせの表の中に置く控えめな導線。正解の値そのものを押しても同じ
 * 早見表が開くので、これは「押せる」ことを伝えるための添え物として、
 * 本文より小さく控えめな色で出す。点数表・役一覧で体裁を揃える。
 */
export function ReferenceLinkButton({
  icon,
  label,
  onClick,
}: ReferenceLinkButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs ${TEXT_LINK_CLASSES}`}
    >
      {icon}
      {label}
    </button>
  );
}
