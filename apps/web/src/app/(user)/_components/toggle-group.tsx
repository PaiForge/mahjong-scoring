"use client";

interface ToggleGroupProps<T extends string> {
  readonly options: readonly { readonly value: T; readonly label: string }[];
  readonly selected: T;
  readonly onChange: (value: T) => void;
}

/**
 * トグルボタングループ
 * 切り替えボタン群
 */
export function ToggleGroup<T extends string>({
  options,
  selected,
  onChange,
}: ToggleGroupProps<T>) {
  return (
    <div className="flex rounded-full border-3 border-ink bg-primary-50 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
            selected === opt.value
              ? "bg-primary-700 text-white"
              : "text-surface-700 hover:bg-primary-100"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
