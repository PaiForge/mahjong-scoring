import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  buildTenpaiHelpCells,
  tenpaiHelpCellFormatters,
} from "@mahjong-scoring/features/practice/help-tour-sample";
import { TENPAI_SCORE_DEMO_QUESTION } from "@mahjong-scoring/features/practice/tenpai-score/demo-question";

import { TenpaiDisplay } from "./tenpai-display";
import { WaitCellGrid } from "./wait-cell-grid";

const noop = () => {};

/** 全マスを正解で埋めた回答（固定の出題なのでモジュールで 1 回だけ組む） */
const { answers: DEMO_ANSWERS } = buildTenpaiHelpCells(
  TENPAI_SCORE_DEMO_QUESTION,
);

/**
 * 聴牌形の点数計算のプレビュー（web の `TenpaiScorePreview`）
 * 聴牌形プレビュー
 *
 * 練習の外（「このアプリについて」）で、固定の出題の聴牌形と、待ち × ツモ /
 * ロンのマスをすべて埋めた状態を描く。押しても何も起きない（操作は空で、
 * 図の枠（`PracticePreview`）がタッチを通さない）。
 */
export function TenpaiScorePreview() {
  const t = useTranslations("tenpaiScore");
  const tScore = useTranslations("agariScore");
  const { formatAnswer } = tenpaiHelpCellFormatters(
    TENPAI_SCORE_DEMO_QUESTION,
    { t: tScore, noYakuLabel: t("cells.noYakuShort") },
  );

  return (
    <View style={styles.root}>
      <TenpaiDisplay question={TENPAI_SCORE_DEMO_QUESTION} showUraDora />
      <WaitCellGrid
        question={TENPAI_SCORE_DEMO_QUESTION}
        cellAnswers={DEMO_ANSWERS}
        selectedCells={[]}
        formatAnswer={formatAnswer}
        onToggleCell={noop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
});
