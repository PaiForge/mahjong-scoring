"use client";

import Link from "next/link";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { HelpIconButton } from "@/app/(user)/_components/help-icon-button";

/**
 * 有料プランの機能で、いまの閲覧者には開放されていないことを示す
 * 設定ロック
 *
 * 機能名・使えない理由・使うための導線を隠さずに読ませる。スイッチの位置には
 * 押せない表記（`badge`。「Pro」）を置き、その下に利用条件（`note`）と
 * 料金ページへのテキストリンク（`linkLabel`）を添える。
 *
 * ぼかしや中央のオーバーレイで覆わない。1 行を覆うには面積が足りず、
 * 描画の崩れに見えるため。Pro の設定が複数になったら、独立したカードに
 * まとめる形を検討する。
 */
export interface SettingToggleLock {
  readonly badge: string;
  readonly note: string;
  readonly linkLabel: string;
  readonly href: string;
}

interface SettingToggleProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
  readonly title?: string;
  readonly isLast?: boolean;
  readonly onInfoClick?: () => void;
  readonly infoAriaLabel?: string;
  /** 指定するとスイッチを出さず、利用条件と料金ページへの導線を出す */
  readonly locked?: SettingToggleLock;
}

export function SettingToggle({
  checked,
  onChange,
  label,
  title,
  isLast = false,
  onInfoClick,
  infoAriaLabel,
  locked,
}: SettingToggleProps) {
  if (locked) {
    // 操作できない行なので hover の反応は付けない。淡い背景で区切るが、
    // 文字のコントラストは通常の行と同じに保つ
    return (
      <div
        className={`bg-surface-50 px-5 py-3.5 ${isLast ? "" : "border-b border-surface-100"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-surface-700">
            {title || label}
          </span>
          <span className="inline-flex shrink-0 items-center rounded-md bg-surface-100 px-2 py-0.5 text-[11px] leading-none font-bold text-surface-600">
            {locked.badge}
          </span>
        </div>
        <p className="mt-1 text-xs text-surface-600">{locked.note}</p>
        <div className="mt-1 text-right text-xs">
          <Link
            href={locked.href}
            className={`font-semibold ${TEXT_LINK_CLASSES}`}
          >
            {locked.linkLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-surface-50 ${isLast ? "" : "border-b border-surface-100"}`}
    >
      <span className="flex items-center gap-1.5">
        <label className="cursor-pointer select-none text-sm font-medium text-surface-700 group-hover:text-surface-900">
          {title || label}
        </label>
        {onInfoClick && (
          <HelpIconButton onClick={onInfoClick} label={infoAriaLabel ?? ""} />
        )}
      </span>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-surface-200 transition-colors duration-200 ease-in-out peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2 peer-checked:bg-primary-500" />
        <span
          className={`pointer-events-none absolute left-[2px] top-[2px] block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
            checked ? "translate-x-[20px]" : "translate-x-0"
          }`}
        />
      </label>
    </div>
  );
}
