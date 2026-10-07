import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type {
  JudgementResult,
  ScoreQuestion,
  UserAnswer,
} from "@mahjong-scoring/core";
import {
  allowsDoubleYakuman,
  getScoreLevelName,
  isMangan,
  isOya,
} from "@mahjong-scoring/core";
import {
  formatHan,
  formatPayment,
} from "@mahjong-scoring/features/practice/score/format-answer";
import { formatScoreAnswer } from "@mahjong-scoring/features/results/format-score-answer";
import { paymentToScoreTableAnswer } from "@mahjong-scoring/features/results/payment-adapter";
import { buildScoreResultDisplay } from "@mahjong-scoring/features/results/score-result-display";

import { BookIcon, TableIcon } from "../../../components/icons/icons";
import { useYakumanRules } from "../../../hooks/use-rule-settings-store";
import { useYakuOrder } from "../../../hooks/use-yaku-order-store";
import { colors } from "../../../lib/theme";
import { ReferenceLinkButton } from "../../components/reference-link-button";
import { useYakuCheatsheetModal } from "../../use-yaku-cheatsheet-modal";
import { DetailsPanelRow } from "./details-panel-row";
import {
  CorrectValue,
  JudgedValue,
  ResultRow,
  ResultSection,
  ResultTableFrame,
  ResultUnansweredValue,
} from "./result-table-frame";
import { ScoreTableModal } from "./score-table-modal";
import { scoreTableFocusOf } from "@mahjong-scoring/features/score-table/focus";
import { YakuJudgementChips } from "./yaku-judgement-chips";

interface ResultDisplayProps {
  readonly question: ScoreQuestion;
  /** ユーザーの回答。無回答の正解開示（「わからない」）では undefined */
  readonly userAnswer?: UserAnswer;
  /** 判定結果。無回答の正解開示（「わからない」）では undefined */
  readonly result?: JudgementResult;
  /**
   * 翻・符・点数の形を取らない回答の一言（聴牌形の点数計算の「役なし」）。
   * `userAnswer` の代わりに「あなたの回答」列の翻数の行へ ✗ 付きで出す
   */
  readonly answerSummary?: string;
  readonly requireYaku?: boolean;
  readonly simplifyMangan?: boolean;
  readonly requireFuForMangan?: boolean;
}

/**
 * 回答結果表示（web の `ResultDisplay`）
 * 結果表示
 *
 * 「あなたの回答」と「正解」を項目（役・翻数・符・点数）ごとに並べ、翻数と
 * 符の内訳を閉じた状態で添える。`userAnswer` / `result` が無い場合は無回答の
 * 正解開示として描き、「あなたの回答」列は落とさず各行に未回答の印を出す
 * （列数を変えると正解の列が動くため）。
 *
 * 正解の点数を押すと点数早見表をその和了のセルで開き、役のチップを押すと
 * 役一覧をその役で開く（web と同じ。どちらも表への補助リンクも置く）。
 */
export function ResultDisplay({
  question,
  userAnswer,
  result,
  answerSummary,
  requireYaku = false,
  simplifyMangan = false,
  requireFuForMangan = false,
}: ResultDisplayProps) {
  const t = useTranslations("score");
  const yakuOrder = useYakuOrder();
  const { answer } = question;
  // ダブル役満採用時は 26 翻を役満へ丸めず「ダブル役満」と表示する
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());
  const isManganOrAbove = isMangan(answer.scoreLevel);
  const scoreLevelName = getScoreLevelName(answer.scoreLevel);
  // 点数表。点数そのものを押したときだけ正解のセルをハイライトする
  // （表への補助リンクからは素の表を開く。web と同じ）
  const [isScoreTableOpen, setIsScoreTableOpen] = useState(false);
  const [isScoreTableHighlighted, setIsScoreTableHighlighted] = useState(false);
  const openScoreTable = (highlighted: boolean) => {
    setIsScoreTableHighlighted(highlighted);
    setIsScoreTableOpen(true);
  };

  const judged =
    userAnswer !== undefined && result !== undefined
      ? { answer: userAnswer, result }
      : undefined;

  // 役の振り分けと内訳の並び・合計は web と共有する
  const {
    answeredYakuJudgements,
    correctYakuJudgements,
    yakuBreakdown,
    fuBreakdown,
  } = buildScoreResultDisplay(question, userAnswer?.yakus, yakuOrder);
  // 役一覧は成立していた役に印を付け、押した役まで送って開く
  const { openYakuCheatsheet, yakuCheatsheetModal } = useYakuCheatsheetModal(
    correctYakuJudgements.map((judgement) => judgement.name),
  );

  const paymentDescription = formatScoreAnswer(
    paymentToScoreTableAnswer(answer.payment),
    (key) => t(`form.options.${key}`),
    { ronSuffix: t("result.pointSuffix") },
  );

  const hanDisplay = (hanValue: number) =>
    formatHan(hanValue, { t, simplifyMangan, allowDoubleYakuman });

  const hanAnswer = judged ? (
    <JudgedValue
      value={hanDisplay(judged.answer.han)}
      isCorrect={judged.result.isHanCorrect}
    />
  ) : answerSummary !== undefined ? (
    <JudgedValue value={answerSummary} isCorrect={false} />
  ) : (
    <ResultUnansweredValue />
  );

  return (
    <View>
      <ResultTableFrame>
        {requireYaku && (
          <ResultSection first>
            <ResultRow
              label={t("form.labels.yaku")}
              answer={
                judged ? (
                  <YakuJudgementChips
                    judgements={answeredYakuJudgements}
                    emptyLabel={t("result.details.none")}
                    onSelect={openYakuCheatsheet}
                  />
                ) : (
                  <ResultUnansweredValue />
                )
              }
              correct={
                <>
                  <YakuJudgementChips
                    judgements={correctYakuJudgements}
                    emptyLabel={t("result.details.none")}
                    onSelect={openYakuCheatsheet}
                  />
                  {/* 役を押しても開けるが、それが分かるように一覧への導線も置く */}
                  <ReferenceLinkButton
                    icon={<BookIcon size={14} color={colors.mutedForeground} />}
                    label={t("result.viewYakuList")}
                    onPress={() => openYakuCheatsheet()}
                  />
                </>
              }
            />
          </ResultSection>
        )}

        <ResultSection first={!requireYaku}>
          <ResultRow
            label={t("form.labels.han")}
            answer={hanAnswer}
            correct={
              <CorrectValue
                value={`${hanDisplay(answer.han)}${
                  !simplifyMangan && scoreLevelName
                    ? ` (${scoreLevelName})`
                    : ""
                }`}
              />
            }
          />
          {yakuBreakdown && (
            <DetailsPanelRow
              title={t("result.details.yakuTitle")}
              items={yakuBreakdown.items}
              total={yakuBreakdown.total}
              suffix={t("form.options.hanSuffix")}
            />
          )}
        </ResultSection>

        {(!isManganOrAbove || requireFuForMangan) && (
          <ResultSection>
            <ResultRow
              label={t("form.labels.fu")}
              answer={
                judged ? (
                  <JudgedValue
                    value={`${judged.answer.fu ?? "-"}${t("form.options.fuSuffix")}`}
                    isCorrect={judged.result.isFuCorrect}
                  />
                ) : (
                  <ResultUnansweredValue />
                )
              }
              correct={
                <CorrectValue
                  value={`${answer.fu ?? "-"}${t("form.options.fuSuffix")}`}
                />
              }
            />
            {fuBreakdown && (
              <DetailsPanelRow
                title={t("result.details.fuTitle")}
                items={fuBreakdown.items}
                total={fuBreakdown.total}
                suffix={t("form.options.fuSuffix")}
                roundedTotal={answer.fu}
                roundUpLabel={t("result.details.roundUp")}
              />
            )}
          </ResultSection>
        )}

        <ResultSection>
          <ResultRow
            label={t("form.labels.score")}
            answer={
              judged ? (
                <JudgedValue
                  value={formatPayment(judged.answer, false, { t })}
                  isCorrect={judged.result.isScoreCorrect}
                />
              ) : (
                <ResultUnansweredValue />
              )
            }
            correct={
              <>
                {/* 押せることが見て分かるよう、常時点線の下線を敷く */}
                <Pressable
                  onPress={() => openScoreTable(true)}
                  accessibilityRole="button"
                  accessibilityHint={t("result.openInScoreTable")}
                  hitSlop={6}
                >
                  <Text style={styles.payment}>{paymentDescription}</Text>
                </Pressable>
                {/* 点数を押しても開けるが、それが分かるように表への導線も置く */}
                <ReferenceLinkButton
                  icon={<TableIcon size={14} color={colors.mutedForeground} />}
                  label={t("result.viewScoreTable")}
                  onPress={() => openScoreTable(false)}
                />
              </>
            }
          />
        </ResultSection>
      </ResultTableFrame>

      <ScoreTableModal
        isOpen={isScoreTableOpen}
        onClose={() => setIsScoreTableOpen(false)}
        focus={scoreTableFocusOf({
          isOya: isOya(question.jikaze),
          isTsumo: question.isTsumo,
          han: answer.han,
          fu: answer.fu,
        })}
        highlighted={isScoreTableHighlighted}
      />
      {yakuCheatsheetModal}
    </View>
  );
}

const styles = StyleSheet.create({
  payment: {
    textAlign: "right",
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface800,
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
    textDecorationColor: colors.surface400,
  },
});
