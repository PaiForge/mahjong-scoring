"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { localizedHref } from "@/i18n/public-path";
import { usePageLocale } from "../_hooks/use-page-locale";

/**
 * 練習画面フッターの操作リンク1件（わからない / 次の問題へ / 終了する / やめる）
 * 練習フッター操作
 *
 * 盤面の下に置く控えめなテキスト操作。`href` を渡すと `next/link` の
 * リンク、`onClick` を渡すとボタンになる。`href` はロケール非依存で受け取り、
 * 今の言語の URL にして張る（英語の盤面から日本語の説明へ落とさない）。
 *
 * 文字の高さ（20px）だけをタップ領域にすると指では狭すぎるため、
 * `min-h-11`（44px）で領域を確保する。見た目は文字と下線のままで、
 * 広がるのは押せる範囲だけ。
 */
type PracticeFooterActionProps = { readonly children: ReactNode } & (
  | {
      readonly href: string;
      /** 遷移に添える処理（トースト表示など）。遷移自体は Link が行う */
      readonly onClick?: () => void;
    }
  | { readonly onClick: () => void; readonly disabled?: boolean }
);

const ACTION_CLASSES = `inline-flex min-h-11 items-center justify-center px-4 text-sm ${TEXT_LINK_CLASSES}`;

export function PracticeFooterAction(props: PracticeFooterActionProps) {
  const locale = usePageLocale();
  if ("href" in props) {
    return (
      <Link
        href={localizedHref(props.href, locale)}
        onClick={props.onClick}
        className={ACTION_CLASSES}
      >
        {props.children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className={`${ACTION_CLASSES} disabled:opacity-50`}
    >
      {props.children}
    </button>
  );
}

/**
 * 練習画面フッターの操作リンクを縦に並べる枠
 * 練習フッター操作群
 *
 * 「わからない」と「終了する」のように押し分けが必要な操作が並ぶため、
 * タップ領域どうしの間に押し間違いを防ぐ余白（gap-3 = 12px）を必ず置く。
 * 練習ごとに余白を書き分けると同じ画面でも間隔がばらつくので、
 * フッター操作を出す箇所はすべてこれを通すこと。
 */
export function PracticeFooterActions({
  children,
}: {
  readonly children: ReactNode;
}) {
  return <div className="flex flex-col items-center gap-3">{children}</div>;
}
