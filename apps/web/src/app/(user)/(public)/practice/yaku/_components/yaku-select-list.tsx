"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { SelectOptionList } from "@/app/(user)/_components/select-option-list";
import { useYakuOptions } from "@/app/_hooks/use-yaku-options";

interface YakuSelectListProps {
  readonly selected: ReadonlySet<string>;
  readonly disabled: boolean;
  readonly onToggle: (yakuName: string) => void;
  /**
   * 出題ごとに変わる番号
   *
   * 変わると一覧を先頭へ戻す。前の問題で下の方までスクロールしていると、
   * 次の問題が出ても一覧はその位置のままで、毎回上まで戻す手間がかかる。
   */
  readonly questionIndex?: number;
  /**
   * 静止画として見せるプレビューか（説明ページの「問題方式」）
   *
   * 低い枠に収め、スクロールを止めて下端をぼかす。読む人はまだ練習を
   * 始めておらず、この場で役を探すことはないため。
   */
  readonly preview?: boolean;
}

/**
 * 役の選択欄（全役をその場に並べたスクロール一覧）
 * 役選択一覧
 *
 * 出題ごとに何度も選ぶ欄なので、モーダルを開いて閉じる操作を挟まず、一覧を
 * ページに出したままにする。全役を並べると縦に長いため、枠の中で一覧自身が
 * スクロールする。行の姿はモーダルの選択肢（点数計算の役選択）と共通。
 *
 * 並びは設定で並び替えられ、点数計算練習の役選択と同じ順になる。
 */
export function YakuSelectList({
  selected,
  disabled,
  onToggle,
  questionIndex,
  preview = false,
}: YakuSelectListProps) {
  const t = useTranslations("common.yakuPicker");
  const options = useYakuOptions();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [questionIndex]);

  const list = (
    <SelectOptionList
      ref={listRef}
      options={options}
      value={[...selected]}
      onToggle={onToggle}
      disabled={disabled}
      label={t("title")}
      scrollable={!preview}
      className={
        preview ? "h-48" : "h-[34dvh] max-h-[32rem] min-h-52 sm:h-[46dvh]"
      }
    />
  );

  if (!preview) return list;

  return (
    <div className="relative">
      {list}
      {/* 枠の内側だけをぼかす（続きがあることを示す。枠線には掛けない） */}
      <div className="pointer-events-none absolute inset-x-[3px] bottom-[3px] h-12 rounded-b-md bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}
