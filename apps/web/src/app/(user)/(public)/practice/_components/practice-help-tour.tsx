"use client";

import { practiceHelpTourLabels } from "@mahjong-scoring/features/practice/help-tour-labels";
import {
  HelpTourButton,
  HelpTourModal,
  type HelpTourSlide,
} from "./help-tour-modal";

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
  readonly slides: readonly HelpTourSlide[];
}

/**
 * 練習の設定画面の「?」とそれが開くヘルプツアー
 * 練習ヘルプツアー
 *
 * 和了形・聴牌形の点数計算が同じ辞書キー（`help.label` / `help.title` と
 * {@link practiceHelpTourLabels} の操作ラベル）で「?」とカルーセルを組む。
 * 各練習はサンプル問題の生成とスライドの中身だけを持ち、器はここに閉じる。
 */
export function PracticeHelpTour({
  t,
  tCommon,
  isOpen,
  onOpen,
  onClose,
  slides,
}: PracticeHelpTourProps) {
  return (
    <>
      <HelpTourButton onClick={onOpen} label={t("help.label")} />
      <HelpTourModal
        isOpen={isOpen}
        onClose={onClose}
        title={t("help.title")}
        slides={slides}
        labels={practiceHelpTourLabels(t, tCommon)}
      />
    </>
  );
}
