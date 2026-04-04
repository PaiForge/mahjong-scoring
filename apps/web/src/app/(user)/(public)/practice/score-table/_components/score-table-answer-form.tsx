"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { ScoreTableQuestion, ScoreTableUserAnswer } from "@mahjong-scoring/core";
import { getAvailableScores } from "../../score/_lib/get-available-scores";

interface ScoreTableAnswerFormProps {
  readonly question: ScoreTableQuestion;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
}

/**
 * 点数表早引きドリルの回答フォーム
 * 点数表回答フォーム
 *
 * 点数のみを select で回答する。翻・符は問題文として表示されるため入力不要。
 */
export function ScoreTableAnswerForm({
  question,
  onSubmit,
  disabled = false,
}: ScoreTableAnswerFormProps) {
  const t = useTranslations("scoreTableDrill");
  const [score, setScore] = useState<string>("");
  const [scoreFromKo, setScoreFromKo] = useState<string>("");
  const [scoreFromOya, setScoreFromOya] = useState<string>("");

  const isKoTsumo = question.isTsumo && !question.isOya;
  const isOyaTsumo = question.isTsumo && question.isOya;

  const availableScores = getAvailableScores(
    question.han,
    question.isOya,
    question.isTsumo,
  );

  // 問題が変わったときにフォームをリセットする
  useEffect(() => {
    setScore("");
    setScoreFromKo("");
    setScoreFromOya("");
  }, [question.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isKoTsumo) {
      const koScore = parseInt(scoreFromKo, 10);
      const oyaScore = parseInt(scoreFromOya, 10);
      if (isNaN(koScore) || isNaN(oyaScore)) return;
      onSubmit({ type: "koTsumo", scoreFromKo: koScore, scoreFromOya: oyaScore });
    } else if (isOyaTsumo) {
      const scoreNum = parseInt(score, 10);
      if (isNaN(scoreNum)) return;
      onSubmit({ type: "oyaTsumo", scoreAll: scoreNum });
    } else {
      const scoreNum = parseInt(score, 10);
      if (isNaN(scoreNum)) return;
      onSubmit({ type: "ron", score: scoreNum });
    }
  };

  const selectClass = (hasValue: boolean) =>
    `w-full rounded-lg border border-surface-300 bg-white px-2 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 disabled:bg-surface-100 ${
      hasValue ? "text-surface-900" : "text-surface-400"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {availableScores.type === "koTsumo" ? (
        <div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-bold text-surface-700">
                {t("fromKo")}
              </label>
              <select
                value={scoreFromKo}
                onChange={(e) => setScoreFromKo(e.target.value)}
                disabled={disabled}
                required
                className={selectClass(scoreFromKo !== "")}
              >
                <option value="" disabled>
                  {t("selectScore")}
                </option>
                {availableScores.koScores.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <span className="mt-6 font-medium text-surface-500">/</span>
            <div className="flex-1">
              <label className="mb-2 block text-sm font-bold text-surface-700">
                {t("fromOya")}
              </label>
              <select
                value={scoreFromOya}
                onChange={(e) => setScoreFromOya(e.target.value)}
                disabled={disabled}
                required
                className={selectClass(scoreFromOya !== "")}
              >
                <option value="" disabled>
                  {t("selectScore")}
                </option>
                {availableScores.oyaScores.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-2 block text-sm font-bold text-surface-700">
            {t("selectScore")}
          </label>
          <select
            value={score}
            onChange={(e) => setScore(e.target.value)}
            disabled={disabled}
            required
            className={selectClass(score !== "")}
          >
            <option value="" disabled>
              {t("selectScore")}
            </option>
            {availableScores.scores.map((s) => (
              <option key={s} value={s}>
                {s}
                {isOyaTsumo ? t("all") : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-lg bg-primary-500 py-3 px-6 font-bold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-surface-400 disabled:text-surface-200"
      >
        {t("answer")}
      </button>
    </form>
  );
}
