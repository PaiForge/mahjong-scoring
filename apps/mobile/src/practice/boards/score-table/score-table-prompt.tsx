import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type { ScoreTableAnswer } from "@mahjong-scoring/core";
import { orderFuHan } from "@mahjong-scoring/features/settings/fu-han-order";

import { useFuHanOrder } from "../../../hooks/use-display-settings-store";
import { colors } from "../../../lib/theme";
import { QuestionPrompt } from "../../components/question-prompt";
import { scoreTableFocusOf } from "@mahjong-scoring/features/score-table/focus";

import { RevealedScoreAnswer } from "../../components/revealed-score-answer";

interface ScoreTablePromptProps {
  readonly isOya: boolean;
  readonly isTsumo: boolean;
  readonly han: number;
  /** 符。満貫以上は点数が符に依存しないため省く */
  readonly fu?: number;
  /**
   * 開示する正解。指定時は出題文の行をこれに差し替える
   * （トレーニングの「わからない」と不正解のあと）
   */
  readonly revealedAnswer?: ScoreTableAnswer;
}

/**
 * 点数表早引きの出題提示（親子・ツモロン・符・翻）
 * 点数表出題提示
 *
 * web の `ScoreTablePrompt` の移植。出題盤面と遊び方デモで共有する、出題条件の
 * 「見せ方」の単一実装。
 */
export function ScoreTablePrompt({
  isOya,
  isTsumo,
  han,
  fu,
  revealedAnswer,
}: ScoreTablePromptProps) {
  const t = useTranslations("scoreTableChallenge");
  const fuHanOrder = useFuHanOrder();

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Text style={styles.condition}>{isOya ? t("oya") : t("ko")}</Text>
        <Text style={styles.condition}>{isTsumo ? t("tsumo") : t("ron")}</Text>
      </View>

      {/* 符と翻の順は表示設定に従う（既定は点数表と同じ符→翻） */}
      <View style={styles.row}>
        {orderFuHan(fuHanOrder, {
          fu: fu === undefined ? undefined : t("fu", { count: fu }),
          han: t("han", { count: han }),
        }).map((label) => (
          <Text key={label} style={styles.fuHan}>
            {label}
          </Text>
        ))}
      </View>

      <QuestionPrompt
        replacement={
          revealedAnswer === undefined ? undefined : (
            <RevealedScoreAnswer
              answer={revealedAnswer}
              translationNamespace="scoreTableChallenge"
              scoreTableFocus={scoreTableFocusOf({ isOya, isTsumo, han, fu })}
            />
          )
        }
      >
        {t("questionLabel")}
      </QuestionPrompt>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  condition: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.surface900,
  },
  fuHan: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary600,
  },
});
