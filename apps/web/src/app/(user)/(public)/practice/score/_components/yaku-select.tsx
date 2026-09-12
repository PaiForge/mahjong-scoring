"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { MultiSelect } from "@/app/(user)/_components/multi-select";
import { useYakuOptions } from "@/app/_hooks/use-yaku-options";

interface YakuLabelRowProps {
  /** ラベルの右端に添える操作（「役なし」のチェックボックス） */
  readonly action?: ReactNode;
}

/**
 * 「役」のラベル行
 * 役ラベル行
 *
 * 役の select の見出しであると同時に、「役なし（ロンできない）」の
 * チェックボックスを置く行でもある。役の回答が不要な設定でも、待ち別点数
 * 計算はこの行だけを出してチェックの置き場にする（役の select は無い）。
 */
export function YakuLabelRow({ action }: YakuLabelRowProps) {
  const t = useTranslations("score");
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label className="block text-sm font-bold text-surface-700">
        {t("form.labels.yaku")}
      </label>
      {action}
    </div>
  );
}

interface YakuSelectProps {
  readonly value: readonly string[];
  readonly onChange: (value: string[]) => void;
  readonly disabled?: boolean;
  /** ラベルの右端に添える操作（{@link YakuLabelRow} に渡す） */
  readonly labelAction?: ReactNode;
}

/**
 * 役選択コンポーネント
 * 役選択
 *
 * 選択肢の並びは役の選択練習と共有する（設定で並び替えられる）。
 */
export function YakuSelect({
  value,
  onChange,
  disabled,
  labelAction,
}: YakuSelectProps) {
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
      <YakuLabelRow action={labelAction} />
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
