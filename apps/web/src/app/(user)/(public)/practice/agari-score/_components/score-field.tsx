"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { koTsumoPaymentKey } from "@mahjong-scoring/core";
import {
  koTsumoPaymentOfKey,
  koTsumoSelectOptions,
  scoreSelectOptions,
} from "@mahjong-scoring/features/practice/score/score-select-options";
import type { UseScorePracticeAnswerFormResult } from "@mahjong-scoring/features/practice/score/use-score-practice-answer-form";
import { ScoreOptionSelect } from "../../_components/score-option-select";
import { AGARI_SCORE_TOUR_ID } from "../_lib/tour-ids";

/**
 * 回答フォームの点数の欄
 * 点数の欄
 *
 * 点数の選択肢の形（`availableScores.type`）で欄が変わる。
 * - `single`: ロン・親ツモの 1 つの select
 * - `koTsumoSplit`: 子ツモの分割入力。「点数」ラベル 1 つに対し select が 2 つ
 *   あるため、ラベルは group の名前として使い、各 select は「子」「親」で名付ける。
 *   組の select は「300/500」だけでは並び順が分からない初学者のため、
 *   ラベルに「子から / 親から」の順を添える
 * - `koTsumoCombined`: 子ツモを組でまとめた 1 つの select
 */
export function ScoreField({
  form,
  disabled,
}: {
  readonly form: Pick<
    UseScorePracticeAnswerFormResult,
    | "availableScores"
    | "score"
    | "scoreFromKo"
    | "scoreFromOya"
    | "koTsumoPayment"
    | "isOyaTsumo"
    | "setScore"
    | "setScoreFromKo"
    | "setScoreFromOya"
    | "setKoTsumoPayment"
  >;
  readonly disabled: boolean;
}) {
  const t = useTranslations("agariScore");
  const scoreId = useId();
  const scoreLabelId = useId();
  const { availableScores } = form;

  return (
    <div data-tour-id={AGARI_SCORE_TOUR_ID.score}>
      <label
        htmlFor={availableScores.type === "koTsumoSplit" ? undefined : scoreId}
        id={scoreLabelId}
        className="mb-2 block text-sm font-bold text-surface-700"
      >
        {availableScores.type === "single"
          ? t("form.labels.score")
          : t("form.labels.koTsumoScore")}
      </label>
      {availableScores.type === "koTsumoSplit" ? (
        <div
          role="group"
          aria-labelledby={scoreLabelId}
          className="flex items-center gap-2"
        >
          <div className="flex-1">
            <ScoreOptionSelect
              value={form.scoreFromKo?.toString()}
              onChange={(v) => form.setScoreFromKo(Number(v))}
              options={scoreSelectOptions(availableScores.koScores)}
              placeholder={t("form.placeholders.fromKo")}
              ariaLabel={t("form.placeholders.fromKo")}
              disabled={disabled}
            />
          </div>
          <span className="font-medium text-surface-500">/</span>
          <div className="flex-1">
            <ScoreOptionSelect
              value={form.scoreFromOya?.toString()}
              onChange={(v) => form.setScoreFromOya(Number(v))}
              options={scoreSelectOptions(availableScores.oyaScores)}
              placeholder={t("form.placeholders.fromOya")}
              ariaLabel={t("form.placeholders.fromOya")}
              disabled={disabled}
            />
          </div>
        </div>
      ) : availableScores.type === "koTsumoCombined" ? (
        <ScoreOptionSelect
          id={scoreId}
          value={form.koTsumoPayment && koTsumoPaymentKey(form.koTsumoPayment)}
          onChange={(key) => {
            const payment = koTsumoPaymentOfKey(availableScores.payments, key);
            if (payment) form.setKoTsumoPayment(payment);
          }}
          options={koTsumoSelectOptions(availableScores.payments)}
          placeholder={t("form.placeholders.select")}
          disabled={disabled}
        />
      ) : (
        <ScoreOptionSelect
          id={scoreId}
          value={form.score?.toString()}
          onChange={(v) => form.setScore(Number(v))}
          options={scoreSelectOptions(
            availableScores.scores,
            form.isOyaTsumo ? t("form.options.all") : "",
          )}
          placeholder={t("form.placeholders.select")}
          disabled={disabled}
        />
      )}
    </div>
  );
}
