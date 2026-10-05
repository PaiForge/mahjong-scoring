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
  judgeYakuSelection,
} from "@mahjong-scoring/core";
import { practiceHanTier } from "@mahjong-scoring/features/practice/score/han-tiers";
import { formatScoreAnswer } from "@mahjong-scoring/features/results/format-score-answer";
import { orderYakuDetails } from "@mahjong-scoring/features/results/order-yaku-details";
import { paymentToScoreTableAnswer } from "@mahjong-scoring/features/results/payment-adapter";

import { TableIcon } from "../../../components/icons/icons";
import { useYakumanRules } from "../../../hooks/use-rule-settings-store";
import { useYakuOrder } from "../../../hooks/use-yaku-order-store";
import { colors } from "../../../lib/theme";
import { ReferenceLinkButton } from "../../components/reference-link-button";
import { DetailsPanelRow, type DetailItem } from "./details-panel-row";
import {
  CorrectValue,
  JudgedValue,
  ResultRow,
  ResultSection,
  ResultTableFrame,
  ResultUnansweredValue,
} from "./result-table-frame";
import { ScoreTableModal } from "./score-table-modal";
import { YakuJudgementChips } from "./yaku-judgement-chips";

interface ResultDisplayProps {
  readonly question: ScoreQuestion;
  /** ユーザーの回答。無回答の正解開示（「わからない」）では undefined */
  readonly userAnswer?: UserAnswer;
  /** 判定結果。無回答の正解開示（「わからない」）では undefined */
  readonly result?: JudgementResult;
  /**
   * 翻・符・点数の形を取らない回答の一言（待ち別点数計算の「役なし」）。
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
 * 正解の点数を押すと、この和了の親子・ロンツモで点数早見表を開く。web の
 * 役一覧モーダル（役のチップ・「役一覧を確認」）はモバイルに役一覧が無いため
 * 持たない。
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
  const [isScoreTableOpen, setIsScoreTableOpen] = useState(false);

  const judged =
    userAnswer !== undefined && result !== undefined
      ? { answer: userAnswer, result }
      : undefined;
  const fuTotal =
    question.fuDetails?.reduce((acc, curr) => acc + curr.fu, 0) ?? 0;
  const yakuTotal =
    question.yakuDetails?.reduce((acc, curr) => acc + curr.han, 0) ?? 0;

  // 役は「合っていた / 余分だった / 選び忘れた」を役ごとに見せる
  const yakuJudgements = judgeYakuSelection(question, userAnswer?.yakus ?? []);
  const answeredYakuJudgements = yakuJudgements.filter(
    (judgement) => judgement.state !== "missed",
  );
  const correctYakuJudgements = yakuJudgements.filter(
    (judgement) => judgement.state !== "incorrect",
  );

  // 翻数の内訳は設定の役の並び順に載せ替える
  const yakuDetailItems: readonly DetailItem[] = orderYakuDetails(
    question.yakuDetails ?? [],
    yakuOrder,
  ).map((d) => ({ name: d.name, value: d.han }));
  const fuDetailItems: readonly DetailItem[] =
    question.fuDetails?.map((d) => ({ name: d.reason, value: d.fu })) ?? [];

  const paymentDescription = formatScoreAnswer(
    paymentToScoreTableAnswer(answer.payment),
    (key) => t(`form.options.${key}`),
    { ronSuffix: t("result.pointSuffix") },
  );

  const hanDisplay = (hanValue: number, levelName?: string) => {
    const tier = simplifyMangan
      ? practiceHanTier(hanValue, allowDoubleYakuman)
      : undefined;
    if (tier) return levelName ?? t(`form.options.${tier.key}`);
    return `${hanValue}${t("form.options.hanSuffix")}`;
  };

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
                  />
                ) : (
                  <ResultUnansweredValue />
                )
              }
              correct={
                <YakuJudgementChips
                  judgements={correctYakuJudgements}
                  emptyLabel={t("result.details.none")}
                />
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
          {yakuDetailItems.length > 0 && (
            <DetailsPanelRow
              title={t("result.details.yakuTitle")}
              items={yakuDetailItems}
              total={yakuTotal}
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
            {question.fuDetails && (
              <DetailsPanelRow
                title={t("result.details.fuTitle")}
                items={fuDetailItems}
                total={fuTotal}
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
                  value={
                    judged.answer.scoreFromKo !== undefined
                      ? `${judged.answer.scoreFromKo}/${judged.answer.scoreFromOya}`
                      : `${judged.answer.score}${t("result.pointSuffix")}`
                  }
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
                  onPress={() => setIsScoreTableOpen(true)}
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
                  onPress={() => setIsScoreTableOpen(true)}
                />
              </>
            }
          />
        </ResultSection>
      </ResultTableFrame>

      <ScoreTableModal
        isOpen={isScoreTableOpen}
        onClose={() => setIsScoreTableOpen(false)}
        role={isOya(question.jikaze) ? "oya" : "ko"}
        winType={question.isTsumo ? "tsumo" : "ron"}
      />
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
