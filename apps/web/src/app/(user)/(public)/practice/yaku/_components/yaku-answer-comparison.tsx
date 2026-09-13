"use client";

import { useTranslations } from "next-intl";
import { judgeYakuName } from "@mahjong-scoring/core";
import { useYakuOrder } from "@/app/_hooks/use-yaku-order-store";
import { useYakuLabel } from "@/app/_hooks/use-yaku-options";
import { AnswerComparison } from "../../_components/answer-comparison";
import { useYakuCheatsheetModal } from "../../_hooks/use-yaku-cheatsheet-modal";
import { AnswerOutcome } from "../../_lib/result-schemas";
import { YakuChip } from "./yaku-chip";

interface YakuAnswerComparisonProps {
  readonly correctYakuNames: readonly string[];
  /** ユーザーが選んだ役。時間切れで答えられなかった問題では undefined */
  readonly selectedYakuNames: readonly string[] | undefined;
  /**
   * 1 問の顛末。無回答のまま開示したときは undefined（正誤の色を出さない）。
   * 時間切れは回答欄が「時間切れ（未回答）」になり、成立していた役のチップは
   * 選び忘れ（黄）ではなく成立（緑）で出す — 比べる回答が無いので取りこぼしとは
   * 言えない
   */
  readonly outcome: AnswerOutcome | undefined;
}

/**
 * 役選択の答え合わせ（成立していた役 / あなたの回答の対比）
 * 役答え合わせ
 *
 * トレーニングの停止中と結果ページの問題別フィードバックで共有する。同じ
 * 答え合わせを出題直後とあとから見返すときで別物の体裁にしないため、
 * 組み立てをここ 1 箇所に置く。
 *
 * チップの状態は core の `judgeYakuName` が決め、選べた役は緑、選び忘れは黄、
 * 余分に選んだ役は赤になる。「成立していた役」の行に選び忘れも並ぶので、
 * 自分が選んだ役の欄だけでは見えない取りこぼしもこの表で読める。
 *
 * 早見表に載る役のチップは押せて、役一覧モーダルがその役に着地する
 * （点数計算の無限訓練の答え合わせと同じ導線）。選び忘れた役・余分に
 * 選んだ役ほど「どんな形の役だったか」を確かめたくなるため。成立していた
 * 役には一覧内で目印が付く。
 */
export function YakuAnswerComparison({
  correctYakuNames,
  selectedYakuNames,
  outcome,
}: YakuAnswerComparisonProps) {
  const t = useTranslations("yaku");
  const tChallenge = useTranslations("challenge");
  const labelOf = useYakuLabel();
  const yakuOrder = useYakuOrder();
  const { canOpenYakuCheatsheet, openYakuCheatsheet, yakuCheatsheetModal } =
    useYakuCheatsheetModal(correctYakuNames);
  // チップの色を決めるときの「選んだ役」。時間切れは正解をそのまま入れて
  // 成立していた役を緑で出す
  const judgedSelection =
    outcome === AnswerOutcome.TimeUp
      ? correctYakuNames
      : (selectedYakuNames ?? []);

  /** 役名を表示順に並べてチップにする（選択順・判定順のばらつきを見せない） */
  const chips = (names: readonly string[]) => {
    const ordered = yakuOrder.filter((yaku) => names.includes(yaku));
    if (ordered.length === 0) return t("result.none");

    return (
      <span className="flex flex-wrap gap-1.5">
        {ordered.map((yakuName) => (
          <YakuChip
            key={yakuName}
            label={labelOf(yakuName)}
            feedbackState={judgeYakuName(
              yakuName,
              judgedSelection,
              correctYakuNames,
            )}
            onSelect={
              canOpenYakuCheatsheet(yakuName)
                ? () => openYakuCheatsheet(yakuName)
                : undefined
            }
            title={tChallenge("openInYakuList")}
          />
        ))}
      </span>
    );
  };

  return (
    <>
      <AnswerComparison
        translationNamespace="yaku"
        outcome={outcome}
        correct={chips(correctYakuNames)}
        user={selectedYakuNames && chips(selectedYakuNames)}
      />
      {yakuCheatsheetModal}
    </>
  );
}
