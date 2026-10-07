import { Hai } from "@pai-forge/mahjong-react-ui";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type {
  HaiKindId,
  JudgementResult,
  MachiCellAnswer,
  MachiScoreQuestion,
  MachiSelectionJudgement,
  ScoreQuestion,
} from "@mahjong-scoring/core";
import {
  cellKeyOf,
  listCellRefs,
  type MachiCellRef,
} from "@mahjong-scoring/features/practice/machi-score/cell-ref";
import { correctCellAnswerOf } from "@mahjong-scoring/features/practice/machi-score/format-cell-answer";
import {
  machiTileMark,
  type MachiTileMark,
} from "@mahjong-scoring/features/practice/machi-score/machi-tile-mark";

import { TehaiMentsuBreakdown } from "../../../board/tehai-mentsu-breakdown";
import { Button } from "../../../components/button";
import { colors, radius } from "../../../lib/theme";
import { JudgementMark } from "../../components/judgement-mark";
import { ResultDisplay } from "../score/result-display";
import { MACHI_TILE_MARK_STYLES } from "./machi-tile-mark-styles";
import { NoYakuResultDisplay } from "./no-yaku-result-display";
import { WaitCellTabs } from "./wait-cell-tabs";

/**
 * 判定の印を付けた牌 1 枚
 * 印付きの牌
 *
 * 枠は印が無くても同じ太さで描く（色だけ透明にする）。印の有無で牌の
 * 大きさが変わると、2 列で同じ牌が縦にずれて比べにくい。
 */
function MarkedHai({
  hai,
  mark,
}: {
  readonly hai: HaiKindId;
  /** 判定の印。無いときは枠を透明にして場所だけ取る */
  readonly mark?: MachiTileMark;
}) {
  return (
    <View
      style={[
        styles.markedHai,
        mark ? MACHI_TILE_MARK_STYLES[mark] : styles.unmarked,
      ]}
    >
      <Hai hai={hai} size="xs" />
    </View>
  );
}

interface MachiScoreResultProps {
  readonly question: MachiScoreQuestion;
  /** 選んだ待ち牌（あなたの回答）。判定前に開示したときは空 */
  readonly selectedMachi: readonly HaiKindId[];
  /** 待ち牌の判定。「わからない」で待ちを答える前に開示したときは undefined */
  readonly machiJudgement: MachiSelectionJudgement | undefined;
  readonly cellAnswers: Readonly<Record<string, MachiCellAnswer>>;
  /** マスごとの判定。「わからない」での開示では undefined */
  readonly cellResults: Readonly<Record<string, JudgementResult>> | undefined;
  /** 回答を「翻・符」「支払い」の行に分ける（`formatCellAnswerLines`） */
  readonly formatAnswerLines: (
    answer: MachiCellAnswer,
    isTsumo: boolean,
  ) => readonly string[];
  readonly requireYaku: boolean;
  readonly simplifyMangan: boolean;
  readonly requireFuForMangan: boolean;
  readonly onNext: () => void;
}

/**
 * 待ち別点数計算の答え合わせ（web の `MachiScoreResult`）
 * 待ち別結果表示
 *
 * 上に待ち牌（あなたの回答と正解）、下に待ちごとの点数計算（マスを選ぶ
 * タブと、選んだマスの内訳）を出す。どちらも「あなたの回答」と「正解」を
 * 並べた同じ形にする。面子分解はパネルの末尾、結果表の下に置く。
 */
export function MachiScoreResult({
  question,
  selectedMachi,
  machiJudgement,
  cellAnswers,
  cellResults,
  formatAnswerLines,
  requireYaku,
  simplifyMangan,
  requireFuForMangan,
  onNext,
}: MachiScoreResultProps) {
  const t = useTranslations("machiScore.result");
  const tCells = useTranslations("machiScore.cells");
  const tScore = useTranslations("score");
  const tCommon = useTranslations("common");
  const cells = listCellRefs(question);
  const [focused, setFocused] = useState<MachiCellRef>(cells[0]);
  // 選んだ順ではなく牌の順に並べ、正解の列と横に見比べられるようにする
  const answeredMachi = [...selectedMachi].sort((a, b) => a - b);

  const cellQuestionOf = (cell: MachiCellRef): ScoreQuestion | undefined => {
    const wait = question.waits.find((w) => w.agariHai === cell.agariHai);
    return cell.isTsumo ? wait?.tsumo : wait?.ron;
  };

  const focusedKey = cellKeyOf(focused);
  const focusedQuestion = cellQuestionOf(focused);
  const focusedAnswer = cellAnswers[focusedKey];
  const focusedResult = cellResults?.[focusedKey];

  return (
    <View style={styles.root}>
      {/* 待ち牌の答え合わせ（「あなたの回答」と「正解」を並べる） */}
      <View style={styles.section}>
        <Text style={styles.heading}>{t("machiTitle")}</Text>
        <View style={styles.machiTable}>
          <View style={styles.machiHeader}>
            <Text style={styles.machiHeaderText}>
              {tScore("result.headers.answer")}
            </Text>
            <Text style={styles.machiHeaderText}>
              {tScore("result.headers.correct")}
            </Text>
          </View>
          <View style={styles.machiRow}>
            <View style={styles.machiCell}>
              {machiJudgement ? (
                <>
                  {answeredMachi.map((hai) => (
                    <MarkedHai
                      key={hai}
                      hai={hai}
                      mark={machiTileMark(hai, true, machiJudgement)}
                    />
                  ))}
                  <JudgementMark
                    verdict={machiJudgement.isCorrect ? "correct" : "incorrect"}
                    size={24}
                    accessibilityLabel={tCommon(
                      machiJudgement.isCorrect ? "correct" : "incorrect",
                    )}
                  />
                </>
              ) : (
                <Text style={styles.unanswered}>
                  {tScore("result.unanswered")}
                </Text>
              )}
            </View>
            <View style={styles.machiCell}>
              {question.waits.map((wait) => (
                // 選び落とした牌だけ印を残す（選んだ牌の正誤は回答の側が言う）
                <MarkedHai
                  key={wait.agariHai}
                  hai={wait.agariHai}
                  mark={
                    machiJudgement?.missed.includes(wait.agariHai)
                      ? "missed"
                      : undefined
                  }
                />
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* 待ちごとの点数計算の答え合わせ。タブで 1 マスずつ切り替える */}
      <View style={styles.section}>
        <Text style={styles.heading}>{t("summaryTitle")}</Text>
        <View>
          <WaitCellTabs
            cells={cells}
            cellResults={cellResults}
            focused={focused}
            onFocusCell={setFocused}
            correctAnswerLinesOf={(cell) =>
              formatAnswerLines(
                correctCellAnswerOf(cellQuestionOf(cell)),
                cell.isTsumo,
              )
            }
          />
          <View style={styles.panel}>
            {focusedQuestion ? (
              <View style={styles.panelBody}>
                <ResultDisplay
                  key={focusedKey}
                  question={focusedQuestion}
                  userAnswer={
                    focusedAnswer?.kind === "score"
                      ? focusedAnswer.answer
                      : undefined
                  }
                  result={
                    focusedAnswer?.kind === "score" ? focusedResult : undefined
                  }
                  // 「役なし」と答えたマスは翻・符・点数を持たないので、一言で列に出す
                  answerSummary={
                    focusedAnswer?.kind === "noYaku"
                      ? tCells("noYakuShort")
                      : undefined
                  }
                  requireYaku={requireYaku}
                  simplifyMangan={simplifyMangan}
                  requireFuForMangan={requireFuForMangan}
                />
                <TehaiMentsuBreakdown
                  tehai={focusedQuestion.tehai}
                  context={focusedQuestion}
                />
              </View>
            ) : (
              <NoYakuResultDisplay
                userAnswer={focusedAnswer}
                result={focusedResult}
                requireYaku={requireYaku}
                simplifyMangan={simplifyMangan}
              />
            )}
          </View>
        </View>
      </View>

      <Button size="lg" fullWidth onPress={onNext}>
        {tScore("result.next")}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 24,
  },
  section: {
    gap: 8,
  },
  heading: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface900,
  },
  machiTable: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface50,
    padding: 16,
  },
  machiHeader: {
    flexDirection: "row",
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface300,
    paddingTop: 8,
    paddingBottom: 12,
  },
  machiHeaderText: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface600,
  },
  machiRow: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 8,
  },
  machiCell: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 4,
  },
  markedHai: {
    borderWidth: 2,
    borderRadius: radius.sm,
    padding: 2,
  },
  unmarked: {
    borderColor: "transparent",
  },
  unanswered: {
    fontSize: 14,
    color: colors.surface400,
  },
  panel: {
    borderWidth: 3,
    borderColor: colors.ink,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    backgroundColor: colors.white,
    padding: 12,
  },
  panelBody: {
    gap: 12,
  },
});
