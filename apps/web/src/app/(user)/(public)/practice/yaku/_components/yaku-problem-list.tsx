"use client";

import { useTranslations } from "next-intl";
import { parseHais, parseKazehai, parseTehai } from "@mahjong-scoring/core";
import { useYakuOrder } from "@/app/_hooks/use-yaku-order-store";
import { useYakuLabel } from "@/app/_hooks/use-yaku-options";
import { AnswerComparison } from "../../_components/answer-comparison";
import { ProblemListAccordion } from "../../_components/problem-list-accordion";
import { TehaiDisplay } from "../../_components/tehai-display";
import type { YakuQuestionResult } from "../_lib/types";
import { YakuChip, getChipFeedbackState } from "./yaku-chip";

interface YakuProblemListProps {
  readonly results: readonly YakuQuestionResult[];
}

/**
 * 保存された結果から出題内容を復元する
 * 出題復元
 *
 * MSPZ のパースに失敗した場合は undefined を返し、手牌の再表示だけを諦める
 * （役の対比は文字列に依存しないため表示できる）。
 */
function restoreQuestion(result: YakuQuestionResult) {
  const tehai = parseTehai(result.tehai);
  const agariHai = parseHais(result.agariHai)[0];
  const bakaze = parseKazehai(result.bakaze);
  const jikaze = parseKazehai(result.jikaze);
  if (!tehai || agariHai === undefined || !bakaze || !jikaze) return undefined;
  return {
    tehai,
    context: {
      bakaze,
      jikaze,
      agariHai,
      isTsumo: result.isTsumo,
      isRiichi: result.isRiichi,
      doraMarkers: result.doraMarkers.flatMap((marker) => parseHais(marker)),
    },
  };
}

/**
 * 役選択練習の問題別フィードバック一覧
 * 役選択問題一覧
 *
 * 各問をアコーディオン形式で表示し、展開すると出題された手牌と、成立していた
 * 役・自分が選んだ役を確認できる。チップの配色は出題中の答え合わせと同じで、
 * 選べた役は緑、選び忘れは黄、余分に選んだ役は赤になる。
 */
export function YakuProblemList({ results }: YakuProblemListProps) {
  const t = useTranslations("yaku");
  const labelOf = useYakuLabel();
  const yakuOrder = useYakuOrder();

  /** 役名を表示順に並べる（選択順・判定順のばらつきを見せない） */
  const inDisplayOrder = (names: readonly string[]) =>
    yakuOrder.filter((yaku) => names.includes(yaku));

  const chips = (names: readonly string[], result: YakuQuestionResult) => {
    const selected = new Set(result.selectedYakuNames);
    const ordered = inDisplayOrder(names);
    if (ordered.length === 0) return t("result.none");

    return (
      <span className="flex flex-wrap gap-1.5">
        {ordered.map((yakuName) => (
          <YakuChip
            key={yakuName}
            yakuName={yakuName}
            label={labelOf(yakuName)}
            isSelected={selected.has(yakuName)}
            feedbackState={getChipFeedbackState(
              yakuName,
              selected,
              result.correctYakuNames,
            )}
          />
        ))}
      </span>
    );
  };

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="yaku"
      isCorrect={(r) => r.isCorrect}
      renderDetail={(result) => {
        const question = restoreQuestion(result);

        return (
          <div className="space-y-3">
            {question && (
              <TehaiDisplay tehai={question.tehai} context={question.context} />
            )}

            <AnswerComparison
              translationNamespace="yaku"
              isCorrect={result.isCorrect}
              correct={chips(result.correctYakuNames, result)}
              user={chips(result.selectedYakuNames, result)}
            />
          </div>
        );
      }}
    />
  );
}
