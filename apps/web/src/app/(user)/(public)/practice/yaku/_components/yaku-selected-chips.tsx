"use client";

import { useTranslations } from "next-intl";

import { SelectValueBox } from "@/app/(user)/_components/select-value-box";
import { useYakuOptions } from "@/app/_hooks/use-yaku-options";
import { getFeedbackBorderClass } from "../../_lib/feedback-styles";

interface YakuSelectedChipsProps {
  readonly selected: ReadonlySet<string>;
  readonly disabled: boolean;
  readonly onRemove: (yakuName: string) => void;
  /** 正誤フィードバック表示中か。回答直後だけ箱の色が正誤に変わる */
  readonly showFeedback?: boolean;
  /** 直前の回答が正解だったか（未回答は undefined） */
  readonly lastAnswerCorrect?: boolean;
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
 *
 * 回答した瞬間は、この箱の枠と背景が正誤の色に変わる。チャレンジは成立して
 * いた役を出さない（振り返りは結果ページで行う）ので、間違えたこと自体は
 * 自分の回答が赤くなることで気づく。
 */
export function YakuSelectedChips({
  selected,
  disabled,
  onRemove,
  showFeedback = false,
  lastAnswerCorrect,
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
      frameClasses={
        showFeedback
          ? getFeedbackBorderClass(showFeedback, lastAnswerCorrect)
          : undefined
      }
    />
  );
}
