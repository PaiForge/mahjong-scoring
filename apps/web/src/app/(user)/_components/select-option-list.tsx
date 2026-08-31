"use client";

/** 選択肢 1 件 */
export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

interface SelectOptionListProps {
  readonly options: readonly SelectOption[];
  /** 選択済みの値 */
  readonly value: readonly string[];
  readonly onToggle: (value: string) => void;
  readonly disabled?: boolean;
  /** 読み上げ用の一覧名（「役を選択」など） */
  readonly label: string;
  /**
   * 枠の中でスクロールするか（既定: true）
   *
   * false にすると入りきらない選択肢は隠れる。実物を静止画として見せる
   * プレビュー用で、実際に選ぶ一覧では止めない。
   */
  readonly scrollable?: boolean;
  /**
   * 高さの指定（`h-full` や `h-[34dvh]` など）
   *
   * 囲みと配色は上書きしない
   */
  readonly className?: string;
}

/**
 * 選択肢を並べたスクロール一覧
 * 選択肢一覧
 *
 * 枠の中で一覧自身がスクロールし、外側の高さは呼び出し側が決める。
 * モーダルの中（{@link import("./multi-select").MultiSelect}）でも、ページに
 * 直接置く選択欄（役の選択練習）でも同じ行を出すため、体裁をここに集約する。
 */
export function SelectOptionList({
  options,
  value,
  onToggle,
  disabled = false,
  label,
  scrollable = true,
  className = "",
}: SelectOptionListProps) {
  return (
    <div
      role="listbox"
      aria-multiselectable
      aria-label={label}
      className={`flex flex-col rounded-lg border-3 border-ink bg-white ${
        scrollable ? "overflow-y-auto" : "overflow-hidden"
      } ${className}`}
    >
      {options.map((option) => {
        const isSelected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={disabled}
            onClick={() => onToggle(option.value)}
            className={`flex shrink-0 items-center justify-between gap-2 border-b-2 border-dashed border-border/40 px-4 py-3 text-left text-sm transition-colors last:border-b-0 ${
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            } ${
              isSelected
                ? "bg-primary-100 font-medium text-primary-900"
                : "text-surface-700 hover:bg-surface-50"
            }`}
          >
            <span>{option.label}</span>
            {isSelected && (
              <span
                aria-hidden
                className="text-lg leading-none text-primary-600"
              >
                &#10003;
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
