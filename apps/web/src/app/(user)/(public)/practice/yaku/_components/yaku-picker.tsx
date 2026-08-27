"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";

import { MultiSelect } from "@/app/(user)/_components/multi-select";
import { useYakuOptions } from "@/app/_hooks/use-yaku-options";

interface YakuPickerProps {
  readonly selected: ReadonlySet<string>;
  readonly disabled: boolean;
  readonly onToggle: (yakuName: string) => void;
}

/**
 * 役の選択欄（選択済みの表示とモーダルでの選択）
 * 役選択欄
 *
 * 並びは設定で並び替えられ、点数計算練習の役選択と同じ順になる。
 * 答え合わせの表示は担当しない（選び忘れた正解役はこの欄に出ないため、
 * 出題盤面が全役のチップ一覧に切り替える）。
 */
export function YakuPicker({ selected, disabled, onToggle }: YakuPickerProps) {
  const t = useTranslations("common.yakuPicker");
  const options = useYakuOptions();

  const value = useMemo(() => [...selected], [selected]);

  const labels = useMemo(
    () => ({ add: t("add"), title: t("title"), done: t("done") }),
    [t],
  );

  // MultiSelect は「次の選択状態」をまとめて返すが、盤面は 1 役ずつの
  // トグルで状態を持つため、差分を取って足し引きに戻す。
  const handleChange = useCallback(
    (next: string[]) => {
      const nextSet = new Set(next);
      for (const name of nextSet) {
        if (!selected.has(name)) onToggle(name);
      }
      for (const name of selected) {
        if (!nextSet.has(name)) onToggle(name);
      }
    },
    [selected, onToggle],
  );

  return (
    <MultiSelect
      options={options}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      placeholder={t("placeholder")}
      labels={labels}
    />
  );
}
