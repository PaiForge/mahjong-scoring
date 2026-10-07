import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import {
  isOya,
  type ScoreQuestion,
  type ScoreTableAnswer,
} from "@mahjong-scoring/core";
import {
  scoreTableFocusOf,
  type ScoreTableFocus,
} from "@mahjong-scoring/features/score-table/focus";
import { formatScoreAnswer } from "@mahjong-scoring/features/results/format-score-answer";
import { paymentToScoreTableAnswer } from "@mahjong-scoring/features/results/payment-adapter";

import { linkStyles } from "../../lib/link-styles";
import { colors } from "../../lib/theme";
import { ScoreTableModal } from "../endless/score/score-table-modal";

interface RevealedScoreAnswerProps {
  /** 開示する正解の点数 */
  readonly answer: ScoreTableAnswer;
  /** `revealedAnswer` / `pointSuffix` / `all` キーを持つ翻訳名前空間 */
  readonly translationNamespace: string;
  /**
   * 正解を押したときに開く点数表の位置（親子・ロンツモ・翻・符）。渡すと
   * 正解の点数が押せる語になり、そのセルをハイライトした点数早見表を開く
   * （`scoreTableFocusOf` で組む）。渡さなければただの文字
   */
  readonly scoreTableFocus?: ScoreTableFocus;
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
 * 正解の点数は押せる（`scoreTableFocus`）。値を読むだけでは「なぜその点数か」が
 * 分からず、表のどこに載っているかを見て初めて次に引けるようになる（web と
 * 同じ）。押せることは本文中のリンクと同じ下線で示す。
 *
 * 出題文と同じ 1 行（20px）に収める。行を高くすると差し替えた瞬間に
 * 回答欄が動く。ロンの点数には単位が無いため「点」を付ける。
 */
export function RevealedScoreAnswer({
  answer,
  translationNamespace,
  scoreTableFocus,
}: RevealedScoreAnswerProps) {
  const t = useTranslations(translationNamespace);
  const tChallenge = useTranslations("challenge");
  const [isScoreTableOpen, setIsScoreTableOpen] = useState(false);
  const formatted = formatScoreAnswer(answer, (key) => t(key), {
    ronSuffix: t("pointSuffix"),
  });

  return (
    <>
      <Text style={styles.text}>
        {t.rich("revealedAnswer", {
          answer: () =>
            scoreTableFocus === undefined ? (
              formatted
            ) : (
              <Text
                onPress={() => setIsScoreTableOpen(true)}
                accessibilityRole="link"
                accessibilityHint={tChallenge("openInScoreTable")}
                style={linkStyles.inline}
              >
                {formatted}
              </Text>
            ),
        })}
      </Text>
      {scoreTableFocus !== undefined && (
        <ScoreTableModal
          isOpen={isScoreTableOpen}
          onClose={() => setIsScoreTableOpen(false)}
          focus={scoreTableFocus}
          highlighted
        />
      )}
    </>
  );
}

/** 点数問題の正解を、点数早見表を開ける形で表示する */
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
      scoreTableFocus={scoreTableFocusOf({
        isOya: isOya(question.jikaze),
        isTsumo: question.isTsumo,
        han: question.answer.han,
        fu: question.answer.fu,
      })}
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
