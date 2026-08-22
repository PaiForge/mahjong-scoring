"use client";

import {
  TOGGLE_GROUP_CONTAINER_CLASSES,
  toggleItemClasses,
} from "./_lib/toggle-group-classes";

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
    <div className={TOGGLE_GROUP_CONTAINER_CLASSES}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={toggleItemClasses(selected === opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
