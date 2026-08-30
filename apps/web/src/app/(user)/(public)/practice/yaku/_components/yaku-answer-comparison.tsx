"use client";

import { useTranslations } from "next-intl";
import { useYakuOrder } from "@/app/_hooks/use-yaku-order-store";
import { useYakuLabel } from "@/app/_hooks/use-yaku-options";
import { AnswerComparison } from "../../_components/answer-comparison";
import { YakuChip, getChipFeedbackState } from "./yaku-chip";

interface YakuAnswerComparisonProps {
  readonly correctYakuNames: readonly string[];
  readonly selectedYakuNames: readonly string[];
  /** 回答が正解だったか。無回答のまま開示したときは undefined（正誤の色を出さない） */
  readonly isCorrect: boolean | undefined;
}

/**
 * 役選択の答え合わせ（成立していた役 / あなたの回答の対比）
 * 役答え合わせ
 *
 * トレーニングの停止中と結果ページの問題別フィードバックで共有する。同じ
 * 答え合わせを出題直後とあとから見返すときで別物の体裁にしないため、
 * 組み立てをここ 1 箇所に置く。
 *
 * チップの配色は {@link getChipFeedbackState} が決め、選べた役は緑、選び忘れは
 * 黄、余分に選んだ役は赤になる。「成立していた役」の行に選び忘れも並ぶので、
 * 自分が選んだ役の欄だけでは見えない取りこぼしもこの表で読める。
 */
export function YakuAnswerComparison({
  correctYakuNames,
  selectedYakuNames,
  isCorrect,
}: YakuAnswerComparisonProps) {
  const t = useTranslations("yaku");
  const labelOf = useYakuLabel();
  const yakuOrder = useYakuOrder();
  const selected = new Set(selectedYakuNames);

  /** 役名を表示順に並べてチップにする（選択順・判定順のばらつきを見せない） */
  const chips = (names: readonly string[]) => {
    const ordered = yakuOrder.filter((yaku) => names.includes(yaku));
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
              correctYakuNames,
            )}
          />
        ))}
      </span>
    );
  };

  return (
    <AnswerComparison
      translationNamespace="yaku"
      isCorrect={isCorrect}
      correct={chips(correctYakuNames)}
      user={chips(selectedYakuNames)}
    />
  );
}
