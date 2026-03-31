"use client";

import { useState, useEffect, useCallback } from "react";

interface MultiSelectOption {
  readonly value: string;
  readonly label: string;
}

interface MultiSelectLabels {
  readonly add: string;
  readonly title: string;
  readonly done: string;
}

interface MultiSelectProps {
  readonly options: readonly MultiSelectOption[];
  readonly value: readonly string[];
  readonly onChange: (value: string[]) => void;
  readonly placeholder: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly labels: MultiSelectLabels;
}

/**
 * 汎用マルチセレクトコンポーネント
 * マルチセレクト
 */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  className = "",
  labels,
}: MultiSelectProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRemove = (optionToRemove: string) => {
    onChange(value.filter((v) => v !== optionToRemove));
  };

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      handleRemove(optionValue);
    } else {
      onChange([...value, optionValue]);
    }
  };

  const getLabel = (val: string) => {
    return options.find((opt) => opt.value === val)?.label ?? val;
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    },
    [isModalOpen],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={`w-full ${className}`}>
      {/* Chips display / trigger */}
      <div
        className={`flex min-h-[46px] w-full flex-wrap items-center gap-2 rounded-lg border border-surface-300 bg-white px-2 py-2 ${
          disabled ? "cursor-not-allowed bg-surface-100" : "cursor-pointer"
        }`}
        onClick={() => !disabled && setIsModalOpen(true)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            setIsModalOpen(true);
          }
        }}
      >
        {value.length > 0 ? (
          <>
            {value.map((v) => (
              <span
                key={v}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="inline-flex items-center rounded-md bg-primary-100 px-2 py-1 text-sm text-primary-800"
                role="listitem"
              >
                {getLabel(v)}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(v)}
                    className="ml-2 text-primary-600 hover:text-primary-900 focus:outline-none"
                  >
                    &times;
                  </button>
                )}
              </span>
            ))}
          </>
        ) : (
          <span className="px-1 text-sm text-surface-400">{placeholder}</span>
        )}

        {!disabled && value.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className="ml-auto rounded-full p-1 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
            title={labels.add}
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

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-[70vh] flex-col md:h-96">
              <h3 className="mb-4 text-lg font-bold text-surface-900">
                {labels.title}
              </h3>
              <div className="flex-1 overflow-y-auto rounded-lg border border-surface-200">
                {options.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      onClick={() => toggleOption(option.value)}
                      className={`cursor-pointer border-b border-surface-100 px-4 py-3 text-sm transition-colors last:border-0 ${
                        isSelected
                          ? "bg-primary-100 font-medium text-primary-900"
                          : "text-surface-700 hover:bg-surface-50"
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {isSelected && (
                          <span className="text-lg leading-none text-primary-600">
                            &#10003;
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg bg-primary-500 px-6 py-2 font-bold text-white transition-colors hover:bg-primary-600"
                >
                  {labels.done}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
