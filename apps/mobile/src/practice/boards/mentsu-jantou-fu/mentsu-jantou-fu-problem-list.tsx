import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { findAgariHighlight } from "@mahjong-scoring/features/practice/mentsu-jantou-fu/find-agari-highlight";
import {
  restoreItem,
  type RestoredItem,
} from "@mahjong-scoring/features/practice/mentsu-jantou-fu/restore-item";
import type { MentsuJantouFuQuestionResult } from "@mahjong-scoring/features/practice/mentsu-jantou-fu/types";
import { restoreTehaiQuestion } from "@mahjong-scoring/features/results/parse-question-tiles";
import { AnswerOutcome } from "@mahjong-scoring/features/results/result-schemas";

import { TehaiDisplay } from "../../../board/tehai-display";
import { colors, radius } from "../../../lib/theme";
import { ProblemListAccordion } from "../../components/problem-list-accordion";
import { FuItemTiles } from "./fu-item-tiles";

/** 回答行 1 つ（牌と、正解・あなたの回答） */
function ItemRow({
  item,
  highlightedTileIndex,
}: {
  readonly item: RestoredItem;
  readonly highlightedTileIndex: number | undefined;
}) {
  const t = useTranslations("mentsuJantouFu");
  const tCommon = useTranslations("common");
  const { userFu } = item;
  const correct = userFu === item.correctFu;

  return (
    <View
      style={[
        styles.item,
        userFu === undefined
          ? styles.itemTimeUp
          : correct
            ? styles.itemCorrect
            : styles.itemWrong,
      ]}
    >
      <FuItemTiles item={item} highlightedTileIndex={highlightedTileIndex} />
      <View style={styles.answers}>
        <View style={styles.answerLine}>
          <Text style={styles.answerLabel}>{t("result.correctAnswer")}</Text>
          <Text style={[styles.answerValue, { color: colors.surface700 }]}>
            {t("fuSuffix", { value: item.correctFu })}
          </Text>
        </View>
        <View style={styles.answerLine}>
          <Text style={styles.answerLabel}>{t("result.yourAnswer")}</Text>
          <Text
            style={[
              styles.answerValue,
              {
                color:
                  userFu === undefined
                    ? colors.surface500
                    : correct
                      ? colors.primary600
                      : colors.destructive,
              },
            ]}
          >
            {userFu === undefined
              ? tCommon("timeUp")
              : t("fuSuffix", { value: userFu })}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * 面子と雀頭の符練習の問題別フィードバック一覧
 * 面子雀頭符問題一覧
 *
 * web の `MentsuJantouFuProblemList` の移植。展開すると出題された手牌と、
 * 行ごとの正解・自分の回答を確認できる。符は行ごとに答えるため、正誤も
 * 行ごとに示す（どの面子で間違えたのかが分からないと復習にならない）。
 *
 * 時間切れで答えられなかった問題は全行が回答なしで、行の枠は正誤の色を
 * 持たず、回答欄に「時間切れ」を出す。見出しの「n / m 正解」も出さない
 * （0 行正解と読めてしまう）。
 */
export function MentsuJantouFuProblemList({
  results,
}: {
  readonly results: readonly MentsuJantouFuQuestionResult[];
}) {
  const t = useTranslations("mentsuJantouFu");

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="mentsuJantouFu"
      outcome={(r) => r.outcome}
      renderSummary={(result) =>
        result.outcome === AnswerOutcome.TimeUp
          ? undefined
          : t("result.correctItemCount", {
              correct: result.items.filter(
                (item) => item.userFu === item.correctFu,
              ).length,
              total: result.items.length,
            })
      }
      renderDetail={(result) => {
        const question = restoreTehaiQuestion(result);
        const items = result.items.map(restoreItem);
        const highlight = question
          ? findAgariHighlight(items, question.context.agariHai)
          : undefined;

        return (
          <View style={styles.detail}>
            {question && (
              <TehaiDisplay tehai={question.tehai} context={question.context} />
            )}
            <View style={styles.items}>
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  highlightedTileIndex={
                    highlight?.itemId === item.id
                      ? highlight.tileIndex
                      : undefined
                  }
                />
              ))}
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  detail: {
    gap: 12,
  },
  items: {
    gap: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.panel,
    padding: 8,
  },
  itemTimeUp: {
    borderColor: colors.surface300,
    backgroundColor: colors.surface50,
  },
  itemCorrect: {
    borderColor: colors.primary500,
    backgroundColor: colors.primary50,
  },
  itemWrong: {
    borderColor: colors.destructive,
    backgroundColor: colors.destructiveSubtle,
  },
  answers: {
    marginLeft: "auto",
    flexShrink: 0,
    alignItems: "flex-end",
  },
  answerLine: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 4,
  },
  answerLabel: {
    fontSize: 12,
    color: colors.surface500,
  },
  answerValue: {
    fontSize: 12,
    fontWeight: "700",
  },
});
