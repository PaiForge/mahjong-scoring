import type { ReactNode } from "react";
import Link from "next/link";

import { ChevronRightIcon } from "./icons/chevron-right-icon";

/**
 * リストリンクのコンテナ（blindfold-chess の ListLinkContainer 準拠）。
 * 角丸＋ボーダーで囲んだリスト枠。
 */
export function ListLinkContainer({ children }: { readonly children: ReactNode }) {
  return (
    <ul className="overflow-hidden rounded-md border border-border bg-card">{children}</ul>
  );
}

interface ListLinkProps {
  readonly href: string;
  /** 行頭のアイコン（絵文字など） */
  readonly icon: ReactNode;
  readonly title: string;
  /** 右側のメタ情報（日付など） */
  readonly meta?: string;
  /** 右側に表示する追加バッジ（固定表示など） */
  readonly badge?: ReactNode;
}

/**
 * リストの 1 行（blindfold-chess の ListLink 準拠）。
 * アイコン + タイトル + バッジ + メタ + シェブロンの横並び。
 */
export function ListLink({ href, icon, title, meta, badge }: ListLinkProps) {
  return (
    <li className="border-b border-border transition-colors last:border-b-0 hover:bg-muted">
      <Link href={href} className="block px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 text-xl">{icon}</span>
          <div className="min-w-0 flex-1">
            <span className="block truncate font-medium text-foreground">{title}</span>
          </div>
          {badge}
          {meta && (
            <span className="flex-shrink-0 text-xs text-muted-foreground">{meta}</span>
          )}
          <ChevronRightIcon className="size-4 flex-shrink-0 text-foreground/40" />
        </div>
      </Link>
    </li>
  );
}
