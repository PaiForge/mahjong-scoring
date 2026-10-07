"use client";

import { useTranslations } from "next-intl";
import { ProblemListAccordion } from "../../_components/problem-list-accordion";
import { TehaiDisplay } from "../../_components/tehai-display";
import { AnswerOutcome } from "@mahjong-scoring/features/results/result-schemas";
import { restoreTehaiQuestion } from "@mahjong-scoring/features/results/parse-question-tiles";
import { findAgariHighlight } from "@mahjong-scoring/features/practice/mentsu-jantou-fu/find-agari-highlight";
import { restoreItem } from "@mahjong-scoring/features/practice/mentsu-jantou-fu/restore-item";
import type { MentsuJantouFuQuestionResult } from "@mahjong-scoring/features/practice/mentsu-jantou-fu/types";
import { FuItemTiles } from "./fu-item-tiles";

interface MentsuJantouFuProblemListProps {
  readonly results: readonly MentsuJantouFuQuestionResult[];
}

/**
 * 面子と雀頭の符練習の問題別フィードバック一覧
 * 面子雀頭符問題一覧
 *
 * 各問をアコーディオン形式で表示し、展開すると出題された手牌と、行ごとの
 * 正解・自分の回答を確認できる。符は行ごとに答えるため、正誤も行ごとに示す
 * （どの面子で間違えたのかが分からないと復習にならない）。
 *
 * 時間切れで答えられなかった問題は全行が回答なしで、行の枠は正誤の色を
 * 持たず、回答欄に「時間切れ」を出す。見出しの「n / m 行正解」も出さない
 * （0 行正解と読めてしまう）。
 */
export function MentsuJantouFuProblemList({
  results,
}: MentsuJantouFuProblemListProps) {
  const t = useTranslations("mentsuJantouFu");
  const tCommon = useTranslations("common");

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
          <div className="space-y-3">
            {question && (
              <TehaiDisplay tehai={question.tehai} context={question.context} />
            )}

            <ul className="space-y-2">
              {items.map((item) => {
                const { userFu } = item;
                const correct = userFu === item.correctFu;

                return (
                  <li
                    key={item.id}
                    className={`flex min-w-0 items-center gap-2 rounded-panel border p-2 ${
                      userFu === undefined
                        ? "border-surface-300 bg-surface-50"
                        : correct
                          ? "border-primary-500 bg-primary-50"
                          : "border-destructive bg-destructive-subtle"
                    }`}
                  >
                    <FuItemTiles
                      item={item}
                      highlightedTileIndex={
                        highlight?.itemId === item.id
                          ? highlight.tileIndex
                          : undefined
                      }
                    />

                    <dl className="ml-auto shrink-0 text-right text-xs">
                      <div className="flex justify-end gap-1">
                        <dt className="text-surface-500">
                          {t("result.correctAnswer")}
                        </dt>
                        <dd className="font-bold text-surface-700">
                          {t("fuSuffix", { value: item.correctFu })}
                        </dd>
                      </div>
                      <div className="flex justify-end gap-1">
                        <dt className="text-surface-500">
                          {t("result.yourAnswer")}
                        </dt>
                        <dd
                          className={`font-bold ${
                            userFu === undefined
                              ? "text-surface-500"
                              : correct
                                ? "text-primary-600"
                                : "text-destructive"
                          }`}
                        >
                          {userFu === undefined
                            ? tCommon("timeUp")
                            : t("fuSuffix", { value: userFu })}
                        </dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }}
    />
  );
}
