"use client";

import { useTranslations } from "next-intl";
import type { HaiKindId, MachiSelectionJudgement } from "@mahjong-scoring/core";
import { Button } from "@/app/(user)/_components/button";
import { QuestionPrompt } from "../../_components/question-prompt";
import { scrollToPracticeAnchor } from "../../_lib/scroll-anchor";
import { TENPAI_SCORE_TOUR_ID } from "../_lib/tour-ids";
import { MachiPicker } from "./machi-picker";
import { TenpaiScoreSpotlightTour } from "./tenpai-score-spotlight-tour";

/**
 * 待ち牌を選ぶ段階（`machi`）
 * 待ち牌の段階
 *
 * 回答すると正誤を見せたまま同じ段階に留まり、「点数計算へ進む」で次へ。
 * 判定も進むも盤面の先頭へ戻してから行う（押した位置に留まると判定が画面外に残る）。
 */
export function TenpaiMachiPhase({
  selectedMachi,
  machiJudgement,
  requireHanFu,
  onToggle,
  onSubmit,
  onProceed,
}: {
  readonly selectedMachi: readonly HaiKindId[];
  readonly machiJudgement: MachiSelectionJudgement | undefined;
  readonly requireHanFu: boolean;
  readonly onToggle: (hai: HaiKindId) => void;
  readonly onSubmit: () => void;
  readonly onProceed: () => void;
}) {
  const t = useTranslations("tenpaiScore");
  const handleSubmit = () => {
    scrollToPracticeAnchor();
    onSubmit();
  };
  const handleProceed = () => {
    scrollToPracticeAnchor();
    onProceed();
  };
  return (
    <div className="space-y-4">
      {/* 出題文の右端にヘルプツアーの「?」を添える。説明する操作は
          この下に並ぶので、ページの見出しより入口として近い */}
      <div className="flex items-center justify-center gap-1.5">
        <QuestionPrompt
          replacement={
            machiJudgement && (
              <p
                className={`text-center text-sm font-bold ${
                  machiJudgement.isCorrect ? "text-success" : "text-destructive"
                }`}
              >
                {machiJudgement.isCorrect
                  ? t("machi.correct", {
                      count: machiJudgement.correct.length,
                    })
                  : t("machi.incorrect")}
              </p>
            )
          }
        >
          {t("machi.prompt")}
        </QuestionPrompt>
        <TenpaiScoreSpotlightTour requireHanFu={requireHanFu} />
      </div>

      <div data-tour-id={TENPAI_SCORE_TOUR_ID.picker}>
        <MachiPicker
          selected={selectedMachi}
          onToggle={onToggle}
          judgement={machiJudgement}
        />
      </div>

      {/* 選択数の行は判定後も高さを残す。消すとボタンとフッターが
          判定の瞬間に上へずれる */}
      <div className="space-y-2">
        <p className="min-h-4 text-center text-xs leading-4 text-surface-500">
          {machiJudgement
            ? ""
            : t("machi.selectedCount", { count: selectedMachi.length })}
        </p>
        <div data-tour-id={TENPAI_SCORE_TOUR_ID.machiSubmit}>
          {machiJudgement ? (
            <Button size="lg" fullWidth onClick={handleProceed}>
              {t("machi.proceed")}
            </Button>
          ) : (
            <Button
              size="lg"
              fullWidth
              onClick={handleSubmit}
              disabled={selectedMachi.length === 0}
            >
              {t("machi.submit")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
