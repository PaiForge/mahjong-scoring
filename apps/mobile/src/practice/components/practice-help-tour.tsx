import { practiceHelpTourLabels } from "@mahjong-scoring/features/practice/help-tour-labels";

import { HelpIconButton } from "../../components/help-icon-button";
import {
  HelpTourSheet,
  type HelpTourStep,
} from "../../components/help-tour-sheet";
import { HEADER_HELP_FONT_SIZE } from "../../components/operation-help";

/** 練習の名前空間の `t`（`help.label` / `help.title` / `help.prev` 等を引く） */
type Translate = (
  key: string,
  values?: Readonly<Record<string, number>>,
) => string;

interface PracticeHelpTourProps {
  /** 練習の名前空間（`agariScore` / `tenpaiScore`）の `t` */
  readonly t: Translate;
  /** `common` の `t` */
  readonly tCommon: (key: string) => string;
  readonly isOpen: boolean;
  readonly onOpen: () => void;
  readonly onClose: () => void;
  readonly steps: readonly HelpTourStep[];
}

/**
 * 練習の設定画面の「?」とそれが開くヘルプツアー（web の `PracticeHelpTour`）
 * 練習ヘルプツアー
 *
 * 和了形・聴牌形の点数計算が同じ辞書キー（`help.label` / `help.title` と
 * {@link practiceHelpTourLabels} の操作ラベル）で、見出しの「?」とシートを組む。
 * 各練習はサンプル問題の生成と枚の中身だけを持ち、器はここに閉じる。
 */
export function PracticeHelpTour({
  t,
  tCommon,
  isOpen,
  onOpen,
  onClose,
  steps,
}: PracticeHelpTourProps) {
  return (
    <>
      <HelpIconButton
        onPress={onOpen}
        label={t("help.label")}
        fontSize={HEADER_HELP_FONT_SIZE}
      />
      <HelpTourSheet
        isOpen={isOpen}
        onClose={onClose}
        title={t("help.title")}
        steps={steps}
        labels={practiceHelpTourLabels(t, tCommon)}
      />
    </>
  );
}
