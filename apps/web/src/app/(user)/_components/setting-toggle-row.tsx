"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { SkeletonBar } from "@/app/_components/skeleton-bar";
import {
  FOCUS_RING_CLASSES,
  ROW_LINK_TITLE_CLASSES,
} from "@/app/_components/_lib/link-classes";

/** 設定項目を並べるカード */
export function SettingsCard({ children }: { readonly children: ReactNode }) {
  return (
    <div className="divide-y-2 divide-surface-100 overflow-hidden rounded-lg border-3 border-ink bg-white">
      {children}
    </div>
  );
}

interface SettingToggleRowProps {
  /**
   * 行の id。教本などページ外から `/preferences#...` で直接飛んで来る項目に付ける。
   * リンク先とずれないよう、値は `_lib/anchors.ts` の定数から取ること。
   */
  readonly id?: string;
  readonly title: string;
  /** 補足説明。辞書側の改行をそのまま出す */
  readonly description?: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  /**
   * 操作を受け付けない状態。値の読み込み中はスイッチの代わりに
   * 同じ大きさのスケルトンを出し、確定時に行の高さが動かないようにする。
   */
  readonly loading?: boolean;
}

/**
 * 設定のトグル行
 * 設定トグル行
 *
 * 見出し・説明とスイッチを並べた 1 項目。設定ページの項目はすべてこの形で、
 * 「どの設定か」だけが違う。
 */
export function SettingToggleRow({
  id,
  title,
  description,
  checked,
  onChange,
  loading = false,
}: SettingToggleRowProps) {
  return (
    // scroll-mt-* はアンカー着地時に項目が画面上端へ張り付かないための余白、
    // target: は「どれが目当ての項目か」を着地後も示すための下地。
    <div
      id={id}
      className="flex scroll-mt-24 items-center justify-between px-5 py-4 target:bg-primary-50"
    >
      <span className="pr-4">
        <span className="block text-sm font-medium text-surface-900">
          {title}
        </span>
        {description !== undefined && (
          <span className="mt-0.5 block whitespace-pre-line text-xs text-surface-500">
            {description}
          </span>
        )}
      </span>

      {loading ? (
        <SkeletonBar className="h-6 w-11 flex-shrink-0" radius="full" />
      ) : (
        <label className="relative inline-flex flex-shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="peer sr-only"
            aria-label={title}
          />
          <div className="h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent bg-surface-200 transition-colors duration-200 ease-in-out peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2 peer-checked:bg-primary-500" />
          <span
            className={`pointer-events-none absolute left-[2px] top-[2px] block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
              checked ? "translate-x-[20px]" : "translate-x-0"
            }`}
          />
        </label>
      )}
    </div>
  );
}

interface SettingLinkRowProps {
  readonly href: string;
  readonly title: string;
  /** 補足説明。辞書側の改行をそのまま出す */
  readonly description?: string;
}

/**
 * 別ページへ渡す設定行
 * 設定リンク行
 *
 * その場で切り替えるには大きすぎる設定（項目が多い・並べ替えるなど）を
 * 専用ページへ逃がす。設定ページを短く保つためのもので、行の形は
 * {@link SettingToggleRow} と揃える（スイッチの位置に矢印が入る）。
 */
export function SettingLinkRow({
  href,
  title,
  description,
}: SettingLinkRowProps) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface-50 ${FOCUS_RING_CLASSES}`}
    >
      <span className="pr-4">
        <span className={`block text-sm font-medium ${ROW_LINK_TITLE_CLASSES}`}>
          {title}
        </span>
        {description !== undefined && (
          <span className="mt-0.5 block whitespace-pre-line text-xs text-surface-500">
            {description}
          </span>
        )}
      </span>
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0 text-surface-400"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}
