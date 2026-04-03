"use client";

interface SettingToggleProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
  readonly title?: string;
  readonly isLast?: boolean;
  readonly onInfoClick?: () => void;
  readonly infoAriaLabel?: string;
}

export function SettingToggle({ checked, onChange, label, title, isLast = false, onInfoClick, infoAriaLabel }: SettingToggleProps) {
  return (
    <div className={`group flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-surface-50 ${isLast ? "" : "border-b border-surface-100"}`}>
      <span className="flex items-center gap-1.5">
        <label className="cursor-pointer select-none text-sm font-medium text-surface-700 group-hover:text-surface-900">
          {title || label}
        </label>
        {onInfoClick && (
          <button
            type="button"
            onClick={onInfoClick}
            className="inline-flex size-5 items-center justify-center rounded-full text-xs text-surface-400 transition-colors hover:bg-surface-200 hover:text-surface-600"
            aria-label={infoAriaLabel}
          >
            ?
          </button>
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
