import { useEffect, useRef } from "react";
import { useWindowDimensions, type ScrollView } from "react-native";
import { useTranslations } from "use-intl";

import { SelectOptionList } from "../../../components/select-option-list";
import { useYakuOptions } from "../../../hooks/use-yaku-options";

/**
 * 一覧の枠の高さ（web の `YAKU_LIST_HEIGHT_CLASSES` = 34dvh・最小 13rem・最大 32rem）
 * 役一覧の高さ
 *
 * 全役を並べると縦に長いため、画面の高さに対する割合で枠を決めて中を
 * スクロールさせる。トレーニングの停止中に一覧と入れ替わる答え合わせも
 * 同じ高さの枠に入れる。入れ替えで盤面の丈が変わると、押したばかりの
 * ボタンとその下が動くため。
 */
export function useYakuListHeight(): number {
  const { height } = useWindowDimensions();
  return Math.min(512, Math.max(208, Math.round(height * 0.34)));
}

/**
 * 役の選択欄（全役をその場に並べたスクロール一覧。web の `YakuSelectList`）
 * 役選択一覧
 *
 * 出題ごとに何度も選ぶ欄なので、モーダルを挟まず一覧をページに出したまま
 * にする。並びは設定で並び替えられ、点数計算練習の役選択と同じ順になる。
 */
export function YakuSelectList({
  selected,
  disabled,
  onToggle,
  questionIndex,
}: {
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
}) {
  const t = useTranslations("common.yakuPicker");
  const options = useYakuOptions();
  const height = useYakuListHeight();
  const listRef = useRef<ScrollView>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ y: 0, animated: false });
  }, [questionIndex]);

  return (
    <SelectOptionList
      ref={listRef}
      options={options}
      value={[...selected]}
      onToggle={onToggle}
      disabled={disabled}
      label={t("title")}
      style={{ height }}
    />
  );
}
