import { useTranslations } from "use-intl";

import { SelectValueBox } from "../../../components/select-value-box";
import { useYakuOptions } from "../../../hooks/use-yaku-options";
import { feedbackFrameStyle } from "../../feedback-styles";

/**
 * 選択中の役を並べる行（web の `YakuSelectedChips`）
 * 選択中の役
 *
 * 一覧は枠の中でスクロールするため、選んだ役が視界から出てしまう。回答する
 * 直前に何を選んだのかを一目で読めるよう、ボタンの上に並べる。× で外せる。
 * 回答した瞬間は、この箱の枠と背景が正誤の色に変わる。
 */
export function YakuSelectedChips({
  selected,
  disabled,
  onRemove,
  showFeedback = false,
  lastAnswerCorrect,
}: {
  readonly selected: ReadonlySet<string>;
  readonly disabled: boolean;
  readonly onRemove: (yakuName: string) => void;
  /** 正誤フィードバック表示中か。回答直後だけ箱の色が正誤に変わる */
  readonly showFeedback?: boolean;
  /** 直前の回答が正解だったか（未回答は undefined） */
  readonly lastAnswerCorrect?: boolean;
}) {
  const t = useTranslations("common.yakuPicker");
  const options = useYakuOptions();

  return (
    <SelectValueBox
      options={options}
      value={[...selected]}
      placeholder={t("emptySelection")}
      disabled={disabled}
      onRemove={onRemove}
      frameStyle={
        showFeedback
          ? feedbackFrameStyle(showFeedback, lastAnswerCorrect)
          : undefined
      }
    />
  );
}
