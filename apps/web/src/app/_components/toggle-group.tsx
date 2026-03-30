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
export function ToggleGroup<T extends string>({ options, selected, onChange }: ToggleGroupProps<T>) {
  return (
    <div className="flex rounded-md border border-primary-200 bg-primary-50 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
            selected === opt.value
              ? "bg-primary-600 text-white"
              : "text-surface-700 hover:bg-surface-100"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
