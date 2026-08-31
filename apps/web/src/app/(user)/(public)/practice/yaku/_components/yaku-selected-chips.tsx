"use client";

import { useTranslations } from "next-intl";

import { SelectValueBox } from "@/app/(user)/_components/select-value-box";
import { useYakuOptions } from "@/app/_hooks/use-yaku-options";

interface YakuSelectedChipsProps {
  readonly selected: ReadonlySet<string>;
  readonly disabled: boolean;
  readonly onRemove: (yakuName: string) => void;
}

/**
 * 選択中の役を並べる行
 * 選択中の役
 *
 * 一覧は枠の中でスクロールするため、選んだ役が視界から出てしまう。回答する
 * 直前に何を選んだのかを一目で読めるよう、ボタンの上に並べる。× で外せる。
 *
 * 姿は点数計算練習の役選択（モーダルを開く欄の上段）と共通。同じ「選んだ役」
 * が練習ごとに違う見え方をしないようにする。
 */
export function YakuSelectedChips({
  selected,
  disabled,
  onRemove,
}: YakuSelectedChipsProps) {
  const t = useTranslations("common.yakuPicker");
  const options = useYakuOptions();

  return (
    <SelectValueBox
      options={options}
      value={[...selected]}
      placeholder={t("emptySelection")}
      disabled={disabled}
      onRemove={onRemove}
    />
  );
}
