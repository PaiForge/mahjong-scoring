"use client";

import type { SelectOption } from "./select-option-list";

interface SelectValueBoxProps {
  readonly options: readonly SelectOption[];
  /** 選択済みの値 */
  readonly value: readonly string[];
  /** 何も選ばれていないときに出す文言 */
  readonly placeholder: string;
  readonly disabled?: boolean;
  /** チップの × を押したときの解除。省略すると × を出さない */
  readonly onRemove?: (value: string) => void;
  /**
   * 箱を押したときに選択肢を開く（モーダルの選択欄）
   *
   * 省略すると押せない表示専用の箱になる。選択肢を常に画面に出している欄
   * （役の選択練習）は開く先が無いため渡さない。
   */
  readonly onOpen?: () => void;
  /** 開くボタン（＋）の説明。`onOpen` を渡すときだけ使う */
  readonly openLabel?: string;
  /**
   * 枠線と背景のクラス（既定: 白地に ink の枠）
   *
   * 回答の正誤を箱の色で示す練習が、フィードバック中だけ差し替える。
   * 枠線と背景は必ずこの1つで決まる（渡すと disabled の灰色にも勝つ）。
   */
  readonly frameClasses?: string;
}

/**
 * 選択済みの値をチップで並べる箱
 * 選択値の箱
 *
 * モーダルを開く選択欄（{@link import("./multi-select").MultiSelect}）の
 * 上段と、選択肢を常に出している欄の「選択中」の行で同じ姿を出すため、
 * チップの体裁をここに集約する。
 */
export function SelectValueBox({
  options,
  value,
  placeholder,
  disabled = false,
  onRemove,
  onOpen,
  openLabel,
  frameClasses,
}: SelectValueBoxProps) {
  const labelOf = (val: string) =>
    options.find((option) => option.value === val)?.label ?? val;
  const canOpen = onOpen !== undefined && !disabled;

  return (
    <div
      className={`flex min-h-[46px] w-full flex-wrap items-center gap-2 rounded-lg border-3 px-2 py-2 transition-colors ${
        frameClasses ??
        (disabled ? "border-ink bg-surface-100" : "border-ink bg-white")
      } ${disabled ? "cursor-not-allowed" : ""} ${
        canOpen ? "cursor-pointer" : ""
      }`}
      {...(canOpen
        ? {
            role: "button",
            tabIndex: 0,
            onClick: onOpen,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") onOpen();
            },
          }
        : {})}
    >
      {value.length > 0 ? (
        value.map((v) => (
          <span
            key={v}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="inline-flex items-center rounded-md bg-primary-100 px-2 py-1 text-sm text-primary-800"
            role="listitem"
          >
            {labelOf(v)}
            {onRemove && !disabled && (
              <button
                type="button"
                onClick={() => onRemove(v)}
                className="ml-2 text-primary-600 hover:text-primary-900 focus:outline-none"
              >
                &times;
              </button>
            )}
          </span>
        ))
      ) : (
        <span className="px-1 text-sm text-surface-400">{placeholder}</span>
      )}

      {canOpen && value.length > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="ml-auto rounded-full p-1 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
          title={openLabel}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );
}
