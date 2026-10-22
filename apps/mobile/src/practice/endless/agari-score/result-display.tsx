import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { allowsDoubleYakuman, getScoreLevelName } from "@mahjong-scoring/core";
import {
  formatHan,
  formatPayment,
} from "@mahjong-scoring/features/practice/score/format-answer";
import { formatScoreAnswer } from "@mahjong-scoring/features/results/format-score-answer";
import { paymentToScoreTableAnswer } from "@mahjong-scoring/features/results/payment-adapter";
import { resolveScoreResultView } from "@mahjong-scoring/features/results/score-result-view";

import { BookIcon, TableIcon } from "../../../components/icons/icons";
import { useYakumanRules } from "../../../hooks/use-rule-settings-store";
import { useYakuOrder } from "../../../hooks/use-yaku-order-store";
import { linkStyles } from "../../../lib/link-styles";
import { colors } from "../../../lib/theme";
import { ReferenceLinkButton } from "../../components/reference-link-button";
import { useYakuCheatsheetModal } from "../../use-yaku-cheatsheet-modal";
import { useFuHanOrder } from "../../../hooks/use-display-settings-store";
import { BreakdownPanel } from "../../components/breakdown-panel";
import { useResultBreakdownSections } from "./use-result-breakdown-sections";
import {
  CorrectValue,
  JudgedValue,
  ResultRow,
  ResultSection,
  ResultTableFrame,
  ResultUnansweredValue,
} from "./result-table-frame";
import { ScoreTableModal } from "./score-table-modal";
import { scoreTableFocusOfQuestion } from "@mahjong-scoring/features/score-table/focus";
import { useScoreTableModal } from "@mahjong-scoring/features/score-table/use-score-table-modal";
import { YakuJudgementChips } from "./yaku-judgement-chips";
import type { ResultDisplayProps } from "@mahjong-scoring/features/results/result-display-props";

/**
 * 回答結果表示（web の `ResultDisplay`）
 * 結果表示
 *
 * 「あなたの回答」と「正解」を項目（役・翻数・符・点数）ごとに並べ、翻数と
 * 符の内訳は表の下の 1 つの展開エリア（{@link BreakdownPanel}）にまとめる。
 * 開いたときは間違えたほうの内訳を選ぶ。`userAnswer` / `result` が無い場合は無回答の
 * 正解開示として描き、「あなたの回答」列は落とさず各行に未回答の印を出す
 * （列数を変えると正解の列が動くため）。
 *
 * 正解の点数と内訳の答えの値（翻数の合計・符）を押すと点数早見表をその和了の
 * セルで開き、役のチップを押すと役一覧をその役で開く（web と同じ。どちらも
 * 表への補助リンクも置き、点数表の補助リンクは内訳の下にも添える）。
 */
export function ResultDisplay({
  question,
  userAnswer,
  result,
  answerSummary,
  requireYaku = false,
  requireHanFu = true,
  exactHan = false,
  requireFuForMangan = false,
  embedded = false,
}: ResultDisplayProps) {
  const t = useTranslations("agariScore");
  const tScoreTable = useTranslations("scoreTable");
  const { answer } = question;
  // ダブル役満採用時は 26 翻を役満へ丸めず「ダブル役満」と表示する
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());
  const scoreLevelName = getScoreLevelName(answer.scoreLevel);
  // 点数表。値（点数・内訳の翻数と符）を押したときだけ正解のセルを
  // ハイライトする（表への補助リンクからは素の表を開く。web と同じ）
  const scoreTable = useScoreTableModal();

  // 役の振り分け・内訳の並び・符の行の有無・判定の見せ方は web と共有する
  const {
    judged,
    judgedHanFu,
    answeredYakuJudgements,
    correctYakuJudgements,
    correctYakuNames,
    showsFu,
    breakdownTabs,
    initialBreakdown,
  } = resolveScoreResultView({
    question,
    userAnswer,
    result,
    requireHanFu,
    requireFuForMangan,
    yakuOrder: useYakuOrder(),
    fuHanOrder: useFuHanOrder(),
  });
  // 役一覧は成立していた役に印を付け、押した役まで送って開く
  const { openYakuCheatsheet, yakuCheatsheetModal } =
    useYakuCheatsheetModal(correctYakuNames);

  const paymentDescription = formatScoreAnswer(
    paymentToScoreTableAnswer(answer.payment),
    (key) => t(`form.options.${key}`),
    { ronSuffix: t("result.pointSuffix") },
  );

  const hanDisplay = (hanValue: number) =>
    formatHan(hanValue, { t, exactHan, allowDoubleYakuman });

  const hanAnswer = judgedHanFu ? (
    <JudgedValue
      value={
        judgedHanFu.answer.han === undefined
          ? "-"
          : hanDisplay(judgedHanFu.answer.han)
      }
      isCorrect={judgedHanFu.result.isHanCorrect}
    />
  ) : answerSummary !== undefined ? (
    <JudgedValue value={answerSummary} isCorrect={false} />
  ) : (
    <ResultUnansweredValue />
  );

  const breakdownSections = useResultBreakdownSections({
    tabs: breakdownTabs,
    answer,
    hanDisplay,
    onOpenScoreTable: () => scoreTable.open(true),
    onOpenYakuList: openYakuCheatsheet,
  });

  return (
    <View>
      <ResultTableFrame
        embedded={embedded}
        footer={
          breakdownSections.length > 0 ? (
            <BreakdownPanel
              title={t("result.details.toggle")}
              sections={breakdownSections}
              initialKind={initialBreakdown}
              surface="sunken"
              testID="result-breakdown"
              action={
                // 点数の行と同じ導線。正解の位置へ着地させたいときは内訳の
                // 答えの値（翻数・符）を押す
                <ReferenceLinkButton
                  icon={<TableIcon size={14} color={colors.mutedForeground} />}
                  label={tScoreTable("viewScoreTable")}
                  onPress={() => scoreTable.open(false)}
                />
              }
            />
          ) : undefined
        }
      >
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
                  exactHan && scoreLevelName ? ` (${scoreLevelName})` : ""
                }`}
              />
            }
          />
        </ResultSection>

        {showsFu && (
          <ResultSection>
            <ResultRow
              label={t("form.labels.fu")}
              answer={
                judgedHanFu ? (
                  <JudgedValue
                    value={`${judgedHanFu.answer.fu ?? "-"}${t("form.options.fuSuffix")}`}
                    isCorrect={judgedHanFu.result.isFuCorrect}
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
          </ResultSection>
        )}

        <ResultSection final>
          <ResultRow
            final
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
                {/* 押せることが見て分かるよう、常時点線の下線を敷く。点数は
                    最終的な答えなので、正解の値の中でここだけ一段大きくする */}
                <Pressable
                  onPress={() => scoreTable.open(true)}
                  accessibilityRole="button"
                  accessibilityHint={t("result.openInScoreTable")}
                  hitSlop={6}
                >
                  <Text style={[styles.payment, linkStyles.scoreTableValue]}>
                    {paymentDescription}
                  </Text>
                </Pressable>
                {/* 点数を押しても開けるが、それが分かるように表への導線も置く */}
                <ReferenceLinkButton
                  icon={<TableIcon size={14} color={colors.mutedForeground} />}
                  label={tScoreTable("viewScoreTable")}
                  onPress={() => scoreTable.open(false)}
                />
              </>
            }
          />
        </ResultSection>
      </ResultTableFrame>

      <ScoreTableModal
        isOpen={scoreTable.isOpen}
        onClose={scoreTable.close}
        focus={scoreTableFocusOfQuestion(question)}
        highlighted={scoreTable.highlighted}
      />
      {yakuCheatsheetModal}
    </View>
  );
}

const styles = StyleSheet.create({
  payment: {
    textAlign: "right",
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface900,
  },
});
