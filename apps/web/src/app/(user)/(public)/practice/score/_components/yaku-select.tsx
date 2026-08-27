"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { MultiSelect } from "@/app/(user)/_components/multi-select";
import { useYakuOptions } from "@/app/_hooks/use-yaku-options";

interface YakuSelectProps {
  readonly value: readonly string[];
  readonly onChange: (value: string[]) => void;
  readonly disabled?: boolean;
}

/**
 * 役選択コンポーネント
 * 役選択
 *
 * 選択肢の並びは役の選択練習と共有する（設定で並べ替えられる）。
 */
export function YakuSelect({ value, onChange, disabled }: YakuSelectProps) {
  const t = useTranslations("score");
  const tPicker = useTranslations("common.yakuPicker");
  const options = useYakuOptions();

  const labels = useMemo(
    () => ({
      add: tPicker("add"),
      title: tPicker("title"),
      done: tPicker("done"),
    }),
    [tPicker],
  );

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-surface-700">
        {t("form.labels.yaku")}
      </label>
      <MultiSelect
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={tPicker("placeholder")}
        labels={labels}
      />
    </div>
  );
}
