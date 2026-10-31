"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { koTsumoPaymentKey } from "@mahjong-scoring/core";
import { Button } from "@/app/(user)/_components/button";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import {
  useKoTsumoInput,
  useScoreInput,
} from "@/app/_hooks/use-display-settings-store";
import type { ScoreAnswerFormProps } from "@mahjong-scoring/features/practice/score/score-answer-form-props";
import {
  koTsumoPaymentOfKey,
  koTsumoSelectOptions,
  scoreSelectOptions,
} from "@mahjong-scoring/features/practice/score/score-select-options";
import { useScoreAnswerForm } from "@mahjong-scoring/features/practice/score/use-score-answer-form";
import { ScoreLabelRow } from "./score-label-row";
import { ScoreOptionSelect } from "./score-option-select";
import { ScoreTilePicker } from "./score-tile-picker";

/**
 * 点数系練習共通の回答フォーム
 * 点数回答フォーム
 *
 * props の意味と設計（選択即送信・ルール固定）は features の
 * {@link ScoreAnswerFormProps} にある。ここは描画だけを持つ。入力方式
 * （{@link import("@mahjong-scoring/features/settings/score-input").ScoreInputMode}）が
 * `tiles` なら {@link ScoreTilePicker}、`select` なら select で描く。
 * 回答直後の正誤は、タイルなら選んだタイル、select なら select 自身の枠と
 * 地の色で返す（{@link import("../_lib/select-class").getSelectClass} 参照）。
 * トレーニングの正解は {@link import("./revealed-score-answer").RevealedScoreAnswer} が
 * 別に出す。どの分岐もラベル行（{@link ScoreLabelRow}）の右端に入力方式の
 * 切り替えボタンを置く。
 */
export function ScoreAnswerForm({
  isOya,
  isTsumo,
  han,
  onSubmit,
  disabled = false,
  translationNamespace,
  scoreRange,
  autoSubmit = false,
  showFeedback = false,
  lastAnswerCorrect,
  allowDoubleYakuman = false,
  fixedRules = false,
}: ScoreAnswerFormProps) {
  const t = useTranslations(translationNamespace);
  // ラベルと select を紐付ける id（読み上げで見出しを名前として得るため）
  const scoreId = useId();
  const scoreLabelId = useId();
  const koTsumoId = useId();
  const fromKoId = useId();
  const fromOyaId = useId();
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  const storedKoTsumoInput = useKoTsumoInput();
  const scoreInput = useScoreInput();
  // タイルは子ツモを常に組で答える（2 つのタイル群は帯を決められない）
  const koTsumoInput = scoreInput === "tiles" ? "combined" : storedKoTsumoInput;
  const {
    availableScores,
    isOyaTsumo,
    score,
    scoreFromKo,
    scoreFromOya,
    koTsumoPayment,
    selectScore,
    selectFromKo,
    selectFromOya,
    selectKoTsumoPayment,
    isComplete,
    submit,
    showsSubmitButton,
  } = useScoreAnswerForm({
    isOya,
    isTsumo,
    han,
    onSubmit,
    disabled,
    scoreRange,
    autoSubmit,
    kiriageMangan,
    allowDoubleYakuman,
    fixedRules,
    koTsumoInput,
  });
  // 子ツモの分割入力の2つの select は片方だけを染めない。正誤判定は
  // 「子から / 親から」を合わせた1つの回答に対して下るため
  const feedback = { showFeedback, lastAnswerCorrect };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  // 送信ボタンの上の余白は他の回答ボタン（ChallengeSubmitButton の mt-4）と
  // シェルの「次の問題へ」（mt-4）に合わせる。ここだけ広いと、トレーニングで
  // 送信ボタンが「次の問題へ」に入れ替わる瞬間にその差だけ下が動く
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {scoreInput === "tiles" && availableScores.type !== "koTsumoSplit" ? (
        <div>
          <ScoreLabelRow disabled={disabled}>
            <span
              id={scoreLabelId}
              className="block text-sm font-bold text-surface-700"
            >
              {availableScores.type === "koTsumoCombined"
                ? t("koTsumoScore")
                : t("selectScore")}
            </span>
          </ScoreLabelRow>
          <ScoreTilePicker
            available={availableScores}
            isOya={isOya}
            isTsumo={isTsumo}
            value={
              availableScores.type === "koTsumoCombined"
                ? koTsumoPayment && koTsumoPaymentKey(koTsumoPayment)
                : score?.toString()
            }
            onChange={(v) => {
              if (availableScores.type === "single") {
                selectScore(Number(v));
                return;
              }
              const payment = koTsumoPaymentOfKey(availableScores.payments, v);
              if (payment) selectKoTsumoPayment(payment);
            }}
            suffix={isOyaTsumo ? t("all") : ""}
            disabled={disabled}
            labelledBy={scoreLabelId}
            autoSubmit={autoSubmit}
            feedback={feedback}
          />
        </div>
      ) : availableScores.type === "koTsumoSplit" ? (
        <div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label
                htmlFor={fromKoId}
                className="mb-2 block text-sm font-bold text-surface-700"
              >
                {t("fromKo")}
              </label>
              <ScoreOptionSelect
                id={fromKoId}
                value={scoreFromKo?.toString()}
                onChange={(v) => selectFromKo(Number(v))}
                options={scoreSelectOptions(availableScores.koScores)}
                placeholder={t("selectScore")}
                disabled={disabled}
                feedback={feedback}
              />
            </div>
            <span className="mt-6 font-medium text-surface-500">/</span>
            <div className="flex-1">
              {/* この分岐だけ欄全体のラベルが無い（「子から」「親から」の 2 列）。
                  切り替えボタンのために行を 1 本足すと他の分岐と高さが揃わない
                  ので、右の列（「親から」）のラベル行の右端に置く。select + 分割は
                  設定ページで選んだ人しか辿れないが、戻る入口は全変種で揃える。
                  ボタンは -my-1 で行の高さを増やさないので、左の列のラベルと
                  高さは揃ったまま */}
              <ScoreLabelRow disabled={disabled}>
                <label
                  htmlFor={fromOyaId}
                  className="block text-sm font-bold text-surface-700"
                >
                  {t("fromOya")}
                </label>
              </ScoreLabelRow>
              <ScoreOptionSelect
                id={fromOyaId}
                value={scoreFromOya?.toString()}
                onChange={(v) => selectFromOya(Number(v))}
                options={scoreSelectOptions(availableScores.oyaScores)}
                placeholder={t("selectScore")}
                disabled={disabled}
                feedback={feedback}
              />
            </div>
          </div>
        </div>
      ) : availableScores.type === "koTsumoCombined" ? (
        // 「300/500」だけでは並び順が分からない初学者のため、ラベルに
        // 「子から / 親から」の順を添える
        <div>
          <ScoreLabelRow disabled={disabled}>
            <label
              htmlFor={koTsumoId}
              className="block text-sm font-bold text-surface-700"
            >
              {t("koTsumoScore")}
            </label>
          </ScoreLabelRow>
          <ScoreOptionSelect
            id={koTsumoId}
            value={koTsumoPayment && koTsumoPaymentKey(koTsumoPayment)}
            onChange={(key) => {
              const payment = koTsumoPaymentOfKey(
                availableScores.payments,
                key,
              );
              if (payment) selectKoTsumoPayment(payment);
            }}
            options={koTsumoSelectOptions(availableScores.payments)}
            placeholder={t("selectScore")}
            disabled={disabled}
            feedback={feedback}
          />
        </div>
      ) : (
        <div>
          <ScoreLabelRow disabled={disabled}>
            <label
              htmlFor={scoreId}
              className="block text-sm font-bold text-surface-700"
            >
              {t("selectScore")}
            </label>
          </ScoreLabelRow>
          <ScoreOptionSelect
            id={scoreId}
            value={score?.toString()}
            onChange={(v) => selectScore(Number(v))}
            options={scoreSelectOptions(
              availableScores.scores,
              isOyaTsumo ? t("all") : "",
            )}
            placeholder={t("selectScore")}
            disabled={disabled}
            feedback={feedback}
          />
        </div>
      )}

      {/* 自動送信時は「回答する」ボタンを表示しない（選択完了で送信扱い） */}
      {showsSubmitButton && (
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={disabled || !isComplete}
        >
          {t("answer")}
        </Button>
      )}
    </form>
  );
}
