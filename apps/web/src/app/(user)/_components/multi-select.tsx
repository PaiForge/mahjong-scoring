"use client";

import { useState } from "react";

import { ModalShell } from "@/app/_components/modal-shell";
import { Button } from "@/app/(user)/_components/button";
import { ModalCloseButton } from "@/app/(user)/_components/modal-close-button";
import { SelectOptionList, type SelectOption } from "./select-option-list";
import { SelectValueBox } from "./select-value-box";

interface MultiSelectLabels {
  readonly add: string;
  readonly title: string;
  readonly done: string;
  /** 見出しの右の × の aria-label。役は押した時点で反映されるので、× も「完了」と同じく閉じるだけ */
  readonly close: string;
}

interface MultiSelectProps {
  readonly options: readonly SelectOption[];
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

  return (
    <div className={`w-full ${className}`}>
      {/* Chips display / trigger */}
      <SelectValueBox
        options={options}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onRemove={handleRemove}
        onOpen={() => setIsModalOpen(true)}
        openLabel={labels.add}
      />

      {/* Modal */}
      <ModalShell
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        label={labels.title}
      >
        <div className="flex h-[70vh] flex-col md:h-96">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-surface-900">
              {labels.title}
            </h3>
            <ModalCloseButton
              onClick={() => setIsModalOpen(false)}
              label={labels.close}
            />
          </div>
          <SelectOptionList
            options={options}
            value={value}
            onToggle={toggleOption}
            label={labels.title}
            className="flex-1"
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setIsModalOpen(false)}>{labels.done}</Button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
