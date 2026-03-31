interface SettingToggleProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
  readonly title?: string;
  readonly isLast?: boolean;
}

export function SettingToggle({ checked, onChange, label, title, isLast = false }: SettingToggleProps) {
  return (
    <label className={`group flex cursor-pointer items-center justify-between px-5 py-3.5 transition-colors hover:bg-surface-50 ${isLast ? "" : "border-b border-surface-100"}`}>
      <span className="select-none text-sm font-medium text-surface-700 group-hover:text-surface-900">
        {title || label}
      </span>
      <div className="relative inline-flex items-center">
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
      </div>
    </label>
  );
}
