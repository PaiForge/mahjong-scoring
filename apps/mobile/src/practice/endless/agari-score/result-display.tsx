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
import { linkStyles } from "../../../lib/link-styles";
import { colors } from "../../../lib/theme";
import { ReferenceLinkButton } from "../../components/reference-link-button";
import { useYakuCheatsheetModal } from "../../use-yaku-cheatsheet-modal";
import { resolveBreakdownTabs } from "@mahjong-scoring/features/results/breakdown-tabs";
import { useFuHanOrder } from "../../../hooks/use-display-settings-store";
import {
  BreakdownPanel,
  type BreakdownPanelSection,
} from "../../components/breakdown-panel";
import { ResultBreakdownTable } from "./result-breakdown-table";
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
  readonly exactHan?: boolean;
  readonly requireFuForMangan?: boolean;
  /** 既に白い枠を持つ面の中に置くか（{@link ResultTableFrame} の `embedded`） */
  readonly embedded?: boolean;
}

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
  exactHan = false,
  requireFuForMangan = false,
  embedded = false,
}: ResultDisplayProps) {
  const t = useTranslations("agariScore");
  const yakuOrder = useYakuOrder();
  const fuHanOrder = useFuHanOrder();
  const { answer } = question;
  // ダブル役満採用時は 26 翻を役満へ丸めず「ダブル役満」と表示する
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());
  const isManganOrAbove = isMangan(answer.scoreLevel);
  const scoreLevelName = getScoreLevelName(answer.scoreLevel);
  // 点数表。値（点数・内訳の翻数と符）を押したときだけ正解のセルを
  // ハイライトする（表への補助リンクからは素の表を開く。web と同じ）
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
    formatHan(hanValue, { t, exactHan, allowDoubleYakuman });

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

  // 満貫以上は符の行を出さないので、符の内訳も出さない
  const showsFu = !isManganOrAbove || requireFuForMangan;
  const breakdownTabs = resolveBreakdownTabs(
    fuHanOrder,
    {
      han: yakuBreakdown !== undefined,
      fu: showsFu && fuBreakdown !== undefined,
    },
    judged?.result,
  );
  const breakdownSections = breakdownTabs.kinds.flatMap(
    (kind): BreakdownPanelSection[] => {
      if (kind === "han" && yakuBreakdown) {
        return [
          {
            kind,
            tabLabel: `${t("form.labels.han")} ${hanDisplay(answer.han)}`,
            content: (
              <ResultBreakdownTable
                items={yakuBreakdown.items}
                total={yakuBreakdown.total}
                suffix={t("form.options.hanSuffix")}
                onOpenScoreTable={() => openScoreTable(true)}
              />
            ),
          },
        ];
      }
      if (kind === "fu" && fuBreakdown) {
        return [
          {
            kind,
            tabLabel: `${t("form.labels.fu")} ${answer.fu}${t("form.options.fuSuffix")}`,
            content: (
              <ResultBreakdownTable
                items={fuBreakdown.items}
                total={fuBreakdown.total}
                suffix={t("form.options.fuSuffix")}
                roundedTotal={answer.fu}
                onOpenScoreTable={() => openScoreTable(true)}
              />
            ),
          },
        ];
      }
      return [];
    },
  );

  return (
    <View>
      <ResultTableFrame
        embedded={embedded}
        footer={
          breakdownSections.length > 0 ? (
            <BreakdownPanel
              title={t("result.details.toggle")}
              sections={breakdownSections}
              initialKind={breakdownTabs.initial}
              surface="sunken"
              testID="result-breakdown"
              action={
                // 点数の行と同じ導線。正解の位置へ着地させたいときは内訳の
                // 答えの値（翻数・符）を押す
                <ReferenceLinkButton
                  icon={<TableIcon size={14} color={colors.mutedForeground} />}
                  label={t("result.viewScoreTable")}
                  onPress={() => openScoreTable(false)}
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
                  onPress={() => openScoreTable(true)}
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
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface900,
  },
});
