"use client";

import { HelpIconButton } from "@/app/(user)/_components/help-icon-button";
import { LinkButton } from "@/app/(user)/_components/link-button";

/**
 * 有料プランの機能で、いまの閲覧者には開放されていないことを示す
 * 設定ロック
 *
 * スイッチの代わりに料金ページへのボタンを置く。`badge` はその文言
 * （「Pro の機能」など）。
 */
export interface SettingToggleLock {
  readonly badge: string;
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
  /** 指定するとスイッチを出さず、料金ページへのボタンに置き換える */
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
  return (
    <div
      className={`group flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-surface-50 ${isLast ? "" : "border-b-2 border-dashed border-border/40"}`}
    >
      <span className="flex items-center gap-1.5">
        <label className="cursor-pointer select-none text-sm font-medium text-surface-700 group-hover:text-surface-900">
          {title || label}
        </label>
        {onInfoClick && (
          <HelpIconButton onClick={onInfoClick} label={infoAriaLabel ?? ""} />
        )}
      </span>
      {locked ? (
        <LinkButton href={locked.href} variant="secondary" size="sm">
          {locked.badge}
        </LinkButton>
      ) : (
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
      )}
    </div>
  );
}
