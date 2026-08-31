"use client";

/** 選択肢 1 件 */
export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

/** 選択肢を並べる列数 */
type SelectOptionColumns = 1 | 2;

interface SelectOptionListProps {
  readonly options: readonly SelectOption[];
  /** 選択済みの値 */
  readonly value: readonly string[];
  readonly onToggle: (value: string) => void;
  readonly disabled?: boolean;
  /** 読み上げ用の一覧名（「役を選択」など） */
  readonly label: string;
  /**
   * 列数（既定: 1）
   *
   * 選択肢名が短く、狭い枠に多く並べたいときだけ 2 にする。
   */
  readonly columns?: SelectOptionColumns;
  /**
   * 高さの指定（`h-full` や `h-[34dvh]` など）
   *
   * 一覧は枠の中で自分でスクロールする。囲みと配色は上書きしない
   */
  readonly className?: string;
}

const LAYOUT_CLASSES: Readonly<Record<SelectOptionColumns, string>> = {
  1: "flex flex-col",
  2: "grid grid-cols-2 content-start",
};

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
  columns = 1,
  className = "",
}: SelectOptionListProps) {
  // 2 列では行の区切りに加えて左右の列も分ける。1 列は最終行の下線を落とすが、
  // 2 列は最終行が奇数個で欠けることがあるため、全行に下線を残す
  const dividerClasses = columns === 2 ? "odd:border-r-2" : "last:border-b-0";

  return (
    <div
      role="listbox"
      aria-multiselectable
      aria-label={label}
      className={`overflow-y-auto rounded-lg border-3 border-ink bg-white ${LAYOUT_CLASSES[columns]} ${className}`}
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
            className={`flex items-center justify-between gap-2 border-b-2 border-dashed border-border/40 px-3 py-3 text-left text-sm transition-colors ${dividerClasses} ${
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
