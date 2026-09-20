"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { generateValidScoreQuestion, isOya } from "@mahjong-scoring/core";
import type { ScoreQuestion, JudgementResult } from "@mahjong-scoring/core";
import { scoreAnswerToUserAnswer } from "../../_lib/payment-adapter";
import { QuestionDisplay } from "./question-display";
import { ScorePracticeAnswerForm } from "./score-practice-answer-form";
import { ResultDisplay } from "./result-display";
import { Button } from "@/app/(user)/_components/button";
import {
  HelpTourButton,
  HelpTourModal,
} from "../../_components/help-tour-modal";
import type { HelpTourSlide } from "../../_components/help-tour-modal";

/**
 * 点数計算総合演習 ヘルプツアー
 *
 * @description
 * 設定画面の PageTitle 右端に置く「?」ボタン。押すと、初回利用者向けに
 * 「開始する」後のプレイ画面（問題 → 回答 → 結果）を実コンポーネントで
 * プレビューするカルーセルモーダル（{@link HelpTourModal}）を開く。この層は
 * サンプル問題の生成とスライドの中身だけを持つ。
 *
 * @flow
 * 1. PageTitle の「?」ボタンを押すとモーダルが開く（初回開封時にサンプル問題を生成）
 * 2. 問題画面・回答画面・結果画面の3スライドを「戻る/次へ」で閲覧
 * 3. 「閉じる」またはオーバーレイクリック / Esc で終了
 */

const noop = () => {};

const ALL_CORRECT: JudgementResult = {
  isCorrect: true,
  isHanCorrect: true,
  isFuCorrect: true,
  isScoreCorrect: true,
  isYakuCorrect: true,
};

export function ScoreHelpTour() {
  const t = useTranslations("score");
  const tCommon = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);
  // 副露なしの分かりやすいサンプルを初回開封時に1度だけ生成して固定する。
  const [sample, setSample] = useState<ScoreQuestion | undefined>(undefined);

  const open = useCallback(() => {
    setSample(
      (prev) =>
        prev ??
        generateValidScoreQuestion({
          includeFuro: false,
          includeChiitoi: false,
        }),
    );
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const slides = useMemo((): readonly HelpTourSlide[] => {
    if (!sample) return [];
    return [
      {
        key: "question",
        title: t("help.slides.question.title"),
        caption: t("help.slides.question.caption"),
        node: <QuestionDisplay question={sample} />,
      },
      {
        key: "answer",
        title: t("help.slides.answer.title"),
        caption: t("help.slides.answer.caption"),
        node: (
          <ScorePracticeAnswerForm
            onSubmit={noop}
            disabled
            isTsumo={sample.isTsumo}
            isOya={isOya(sample.jikaze)}
          />
        ),
      },
      {
        key: "result",
        title: t("help.slides.result.title"),
        caption: t("help.slides.result.caption"),
        node: (
          // 盤面と同じ組み方（表の下に「次の問題へ」）
          <div className="space-y-4 sm:space-y-6">
            <ResultDisplay
              question={sample}
              userAnswer={scoreAnswerToUserAnswer(sample.answer)}
              result={ALL_CORRECT}
            />
            <Button size="lg" fullWidth onClick={noop}>
              {t("result.next")}
            </Button>
          </div>
        ),
      },
    ];
  }, [sample, t]);

  return (
    <>
      <HelpTourButton onClick={open} label={t("help.label")} />
      <HelpTourModal
        isOpen={isOpen}
        onClose={close}
        title={t("help.title")}
        slides={slides}
        labels={{
          close: tCommon("close"),
          prev: t("help.prev"),
          next: t("help.next"),
        }}
      />
    </>
  );
}
