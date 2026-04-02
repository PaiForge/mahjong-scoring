interface SmallCheckboxProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
}

export function SmallCheckbox({ checked, onChange, label }: SmallCheckboxProps) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 transition-all hover:bg-surface-50">
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer size-5 cursor-pointer appearance-none rounded border-2 border-surface-300 bg-white transition-all checked:border-primary-500 checked:bg-primary-500 hover:border-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
        />
        <svg
          className="pointer-events-none absolute size-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="select-none text-sm font-medium text-surface-700 group-hover:text-surface-900">
        {label}
      </span>
    </label>
  );
}
