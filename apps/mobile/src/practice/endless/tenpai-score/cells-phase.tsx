import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type {
  MachiCellAnswer,
  TenpaiScoreQuestion,
  UserAnswer,
} from "@mahjong-scoring/core";
import type { MachiCellRef } from "@mahjong-scoring/features/practice/tenpai-score/cell-ref";
import {
  CELL_COLUMNS,
  resolveCellsPhaseView,
  type CellColumn,
} from "@mahjong-scoring/features/practice/tenpai-score/cells-phase";
import type { ScorePracticeModeFlags } from "@mahjong-scoring/features/practice/score/generator-options";

import { Button } from "../../../components/button";
import { colors, radius } from "../../../lib/theme";
import { QuestionPrompt } from "../../components/question-prompt";
import { ScorePracticeAnswerForm } from "../agari-score/score-practice-answer-form";
import { WaitCellGrid } from "./wait-cell-grid";

/**
 * 待ち × ツモ/ロン のマスに点数を当てはめる段階（`cells`。web の `TenpaiCellsPhase`）
 * マス回答の段階
 *
 * 当てはめると表の塊が組み変わり、回答欄も入れ替わる。押した位置に
 * 留まると表もボタンも画面外になるので、盤面の先頭へ戻す。
 */
export function CellsPhase({
  question,
  cellAnswers,
  selectedCells,
  questionSeq,
  draftSeq,
  modeFlags,
  isOya,
  formatAnswer,
  scrollToTop,
  onToggleCell,
  onAssign,
  onSubmit,
}: {
  readonly question: TenpaiScoreQuestion;
  readonly cellAnswers: Readonly<Record<string, MachiCellAnswer>>;
  readonly selectedCells: readonly MachiCellRef[];
  /** 出題ごとに増える連番（回答欄の key） */
  readonly questionSeq: number;
  /** 列ごとの回答欄を作り直す連番（当てはめた列だけ増える） */
  readonly draftSeq: Readonly<Record<CellColumn, number>>;
  readonly modeFlags: ScorePracticeModeFlags;
  readonly isOya: boolean;
  readonly formatAnswer: (answer: MachiCellAnswer, isTsumo: boolean) => string;
  readonly scrollToTop: () => void;
  readonly onToggleCell: (cell: MachiCellRef) => void;
  readonly onAssign: (answer: MachiCellAnswer) => void;
  readonly onSubmit: () => void;
}) {
  const t = useTranslations("tenpaiScore");
  const { requireYaku, requireHanFu, exactHan, requireFuForMangan } = modeFlags;
  const { remaining, selectedIsTsumo, isSelecting, prefill } =
    resolveCellsPhaseView(question, selectedCells, cellAnswers);

  const handleAssignScore = (answer: UserAnswer) => {
    scrollToTop();
    onAssign({ kind: "score", answer });
  };
  const handleAssignNoYaku = () => {
    scrollToTop();
    onAssign({ kind: "noYaku" });
  };
  const handleSubmit = () => {
    scrollToTop();
    onSubmit();
  };

  return (
    <View style={styles.stage}>
      <QuestionPrompt>{t("cells.prompt")}</QuestionPrompt>

      <WaitCellGrid
        question={question}
        cellAnswers={cellAnswers}
        selectedCells={selectedCells}
        formatAnswer={formatAnswer}
        onToggleCell={onToggleCell}
      />

      {/* 回答欄はマスを選んだときだけ見せる。列（ツモ / ロン）ごとに 1 つ
          ずつ、1 問の間ずっと mount したまま出し入れする — 選択を解いた・
          別の列を押したの拍子に作り直すと、誤タップ 1 回で入力が失われる。
          作り直すのは当てはめたとき（draftSeq）と次の問題（questionSeq）
          だけ（web と同じ） */}
      {CELL_COLUMNS.map((column) => {
        const isTsumo = column === "tsumo";
        const isShown = selectedIsTsumo === isTsumo;
        return (
          <View
            key={column}
            style={[styles.formPanel, !isShown && styles.hidden]}
          >
            <ScorePracticeAnswerForm
              key={`${questionSeq}:${draftSeq[column]}`}
              onSubmit={handleAssignScore}
              isTsumo={isTsumo}
              isOya={isOya}
              requireYaku={requireYaku}
              requireHanFu={requireHanFu}
              exactHan={exactHan}
              requireFuForMangan={requireFuForMangan}
              submitLabel={t("cells.assign")}
              prefill={isShown ? prefill : undefined}
              // 「役なし」はロンにしか無い回答なので、ロンの欄にだけ出す
              reserveYakuRow
              noYaku={
                isTsumo
                  ? undefined
                  : {
                      label: t("cells.noYaku"),
                      onSelect: handleAssignNoYaku,
                    }
              }
            />
          </View>
        );
      })}

      {/* 「回答する」はマスを選んでいる間も押させない（入力の途中で古い
          回答のまま答え合わせに進まないため）。押せない理由を注記で言う */}
      <View style={styles.submitBlock}>
        {(isSelecting || remaining > 0) && (
          <Text style={styles.note}>
            {remaining > 0
              ? t("cells.remaining", { count: remaining })
              : t("cells.selecting")}
          </Text>
        )}
        <Button
          size="lg"
          fullWidth
          onPress={handleSubmit}
          disabled={remaining > 0 || isSelecting}
        >
          {t("cells.submit")}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    gap: 16,
  },
  submitBlock: {
    gap: 8,
  },
  note: {
    minHeight: 16,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
    color: colors.surface500,
  },
  formPanel: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface50,
    padding: 16,
  },
  hidden: {
    display: "none",
  },
});
