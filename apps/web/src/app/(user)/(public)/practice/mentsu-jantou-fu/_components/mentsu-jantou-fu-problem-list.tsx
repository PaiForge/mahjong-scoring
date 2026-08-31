"use client";

import { useTranslations } from "next-intl";
import { MentsuType, parseHais } from "@mahjong-scoring/core";
import type { CompletedMentsu, HaiKindId } from "@mahjong-scoring/core";
import { ProblemListAccordion } from "../../_components/problem-list-accordion";
import { TehaiDisplay } from "../../_components/tehai-display";
import { buildMentsu } from "../../_lib/mentsu-serialization";
import { parseQuestionTiles } from "../../_lib/parse-question-tiles";
import { findAgariHighlight } from "../_lib/find-agari-highlight";
import type {
  MentsuJantouFuItemResult,
  MentsuJantouFuQuestionResult,
} from "../_lib/types";
import { FuItemTiles } from "./fu-item-tiles";

interface MentsuJantouFuProblemListProps {
  readonly results: readonly MentsuJantouFuQuestionResult[];
}

/** 復元した回答行（出題中の行と同じ形で描くための最小限） */
interface RestoredItem {
  readonly id: string;
  readonly tiles: readonly HaiKindId[];
  readonly type: MentsuType | "Pair";
  readonly isOpen: boolean;
  readonly originalMentsu?: CompletedMentsu;
  readonly correctFu: number;
  readonly userFu: number;
}

/**
 * 保存された結果から出題内容（手牌と状況）を復元する
 * 出題復元
 *
 * MSPZ のパースに失敗した場合は undefined を返し、手牌の再表示だけを諦める
 * （回答行の符の比較は手牌の復元に依存しないため表示できる）。
 */
function restoreQuestion(result: MentsuJantouFuQuestionResult) {
  const tiles = parseQuestionTiles(result);
  if (!tiles) return undefined;
  const { tehai, ...context } = tiles;
  return { tehai, context: { ...context, isTsumo: result.isTsumo } };
}

/** 保存された回答行を、出題中と同じ体裁で描ける形に戻す */
function restoreItem(
  item: MentsuJantouFuItemResult,
  index: number,
): RestoredItem {
  const tiles = parseHais(item.tiles);
  return {
    // 和了牌ハイライトの突き合わせにしか使わないため、並び順から採番する
    id: String(index),
    tiles,
    type: item.type,
    isOpen: item.isOpen,
    // 雀頭は面子ではないため晒す表示を持たない（牌を平らに並べる）
    originalMentsu:
      item.type === "Pair"
        ? undefined
        : buildMentsu(item.type, tiles, item.furo),
    correctFu: item.correctFu,
    userFu: item.userFu,
  };
}

/**
 * 面子と雀頭の符練習の問題別フィードバック一覧
 * 面子雀頭符問題一覧
 *
 * 各問をアコーディオン形式で表示し、展開すると出題された手牌と、行ごとの
 * 正解・自分の回答を確認できる。符は行ごとに答えるため、正誤も行ごとに示す
 * （どの面子で間違えたのかが分からないと復習にならない）。
 */
export function MentsuJantouFuProblemList({
  results,
}: MentsuJantouFuProblemListProps) {
  const t = useTranslations("mentsuJantouFu");

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="mentsuJantouFu"
      isCorrect={(r) => r.isCorrect}
      renderSummary={(result) =>
        t("result.correctItemCount", {
          correct: result.items.filter((item) => item.userFu === item.correctFu)
            .length,
          total: result.items.length,
        })
      }
      renderDetail={(result) => {
        const question = restoreQuestion(result);
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
                const correct = item.userFu === item.correctFu;

                return (
                  <li
                    key={item.id}
                    className={`flex min-w-0 items-center gap-2 rounded-xl border p-2 ${
                      correct
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
                            correct ? "text-primary-600" : "text-destructive"
                          }`}
                        >
                          {t("fuSuffix", { value: item.userFu })}
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
