import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import type { ScoreQuestion, ScoreTableAnswer } from "@mahjong-scoring/core";
import { formatScoreAnswer } from "@mahjong-scoring/features/results/format-score-answer";
import { paymentToScoreTableAnswer } from "@mahjong-scoring/features/results/payment-adapter";

import { colors } from "../../lib/theme";

interface RevealedScoreAnswerProps {
  /** 開示する正解の点数 */
  readonly answer: ScoreTableAnswer;
  /** `revealedAnswer` / `pointSuffix` / `all` キーを持つ翻訳名前空間 */
  readonly translationNamespace: string;
}

/**
 * トレーニングで開示する正解の点数
 * 正解開示表示
 *
 * web の `RevealedScoreAnswer` の移植。点数を答える練習は選択肢を持たない
 * ため、回答のフィードバックだけでは正解値が分からない。「わからない」と
 * 不正解のあとに、出題文の行と差し替えて出す（`QuestionPrompt` の
 * `replacement`）。正解のときは出さない — 選んだ値がそのまま正解で、
 * 枠の色が正誤を示している。
 *
 * web は正解の点数を押すとそのセルをハイライトした点数早見表を開くが、
 * モバイルにはまだ点数早見表が無いため、ただの文字として出す。
 *
 * 出題文と同じ 1 行（20px）に収める。行を高くすると差し替えた瞬間に
 * 回答欄が動く。ロンの点数には単位が無いため「点」を付ける。
 */
export function RevealedScoreAnswer({
  answer,
  translationNamespace,
}: RevealedScoreAnswerProps) {
  const t = useTranslations(translationNamespace);
  const formatted = formatScoreAnswer(answer, (key) => t(key), {
    ronSuffix: t("pointSuffix"),
  });

  return (
    <Text style={styles.text}>
      {t.rich("revealedAnswer", { answer: () => formatted })}
    </Text>
  );
}

/** 点数問題の正解を表示する */
export function RevealedScoreQuestionAnswer({
  question,
  translationNamespace,
}: {
  readonly question: ScoreQuestion;
  readonly translationNamespace: string;
}) {
  return (
    <RevealedScoreAnswer
      answer={paymentToScoreTableAnswer(question.answer.payment)}
      translationNamespace={translationNamespace}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.surface800,
  },
});
