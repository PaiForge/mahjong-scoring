"use client";

import { useTranslations } from "next-intl";

import { SelectOptionList } from "@/app/(user)/_components/select-option-list";
import { useYakuOptions } from "@/app/_hooks/use-yaku-options";

interface YakuSelectListProps {
  readonly selected: ReadonlySet<string>;
  readonly disabled: boolean;
  readonly onToggle: (yakuName: string) => void;
}

/**
 * 役の選択欄（全役をその場に並べたスクロール一覧）
 * 役選択一覧
 *
 * 出題ごとに何度も選ぶ欄なので、モーダルを開いて閉じる操作を挟まず、一覧を
 * ページに出したままにする。全役を並べると縦に長いため、枠の中で一覧自身が
 * スクロールする。
 *
 * 2 列に並べる。役名はどれも短く、狭い画面でも 1 行に 2 つ収まるので、
 * 同じ高さで倍の役が見え、目的の役までのスクロールが半分で済む。
 *
 * 並びは設定で並び替えられ、点数計算練習の役選択と同じ順になる。
 */
export function YakuSelectList({
  selected,
  disabled,
  onToggle,
}: YakuSelectListProps) {
  const t = useTranslations("common.yakuPicker");
  const options = useYakuOptions();

  return (
    <SelectOptionList
      options={options}
      value={[...selected]}
      onToggle={onToggle}
      disabled={disabled}
      label={t("title")}
      columns={2}
      className="h-[34dvh] min-h-52 max-h-[32rem] sm:h-[46dvh]"
    />
  );
}
