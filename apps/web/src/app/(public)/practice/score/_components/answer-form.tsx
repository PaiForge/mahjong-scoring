"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import type { UserAnswer } from "@mahjong-scoring/core";
import {
  RON_SCORES_KO,
  RON_SCORES_OYA,
  TSUMO_SCORES_KO_PART,
  TSUMO_SCORES_OYA_PART,
} from "@mahjong-scoring/core";
import { YakuSelect } from "./yaku-select";

interface AnswerFormProps {
  readonly onSubmit: (answer: UserAnswer) => void;
  readonly disabled?: boolean;
  readonly isTsumo: boolean;
  readonly isOya: boolean;
  readonly requireYaku?: boolean;
  readonly simplifyMangan?: boolean;
  readonly requireFuForMangan?: boolean;
  readonly onSkip?: () => void;
  readonly onExit?: () => void;
}

type ScoreFilterType =
  | "ronKo"
  | "ronOya"
  | "tsumoKoKo"
  | "tsumoKoOya"
  | "tsumoOyaAll";

/**
 * 回答フォームコンポーネント
 * 回答フォーム
 */
export function AnswerForm({
  onSubmit,
  disabled = false,
  isTsumo,
  isOya,
  requireYaku = false,
  simplifyMangan = false,
  requireFuForMangan = false,
  onSkip,
  onExit,
}: AnswerFormProps) {
  const t = useTranslations("score");
  const [han, setHan] = useState<number | undefined>(undefined);
  const [fu, setFu] = useState<number | undefined>(undefined);
  const [yakus, setYakus] = useState<string[]>([]);
  const [score, setScore] = useState<string>("");
  const [scoreFromKo, setScoreFromKo] = useState<string>("");
  const [scoreFromOya, setScoreFromOya] = useState<string>("");

  const isMangan = han !== undefined && han >= 5;
  const isFuRequired = !isMangan || requireFuForMangan;
  const isKoTsumo = isTsumo && !isOya;

  const hanOptions = useMemo(() => {
    if (simplifyMangan) {
      return [
        { value: "", label: t("form.placeholders.select") },
        { value: 1, label: `1${t("form.options.hanSuffix")}` },
        { value: 2, label: `2${t("form.options.hanSuffix")}` },
        { value: 3, label: `3${t("form.options.hanSuffix")}` },
        { value: 4, label: `4${t("form.options.hanSuffix")}` },
        { value: 5, label: t("form.options.mangan") },
        { value: 6, label: t("form.options.haneman") },
        { value: 8, label: t("form.options.baiman") },
        { value: 11, label: t("form.options.sanbaiman") },
        { value: 13, label: t("form.options.yakuman") },
      ];
    }
    return [
      { value: "", label: t("form.placeholders.select") },
      ...Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: `${i + 1}${t("form.options.hanSuffix")}`,
      })),
      { value: 13, label: t("form.options.yakuman") },
    ];
  }, [simplifyMangan, t]);

  const fuOptions = useMemo(
    () => [
      { value: "", label: t("form.placeholders.select") },
      ...[20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110].map((v) => ({
        value: v,
        label: `${v}${t("form.options.fuSuffix")}`,
      })),
    ],
    [t],
  );

  const handleHanChange = (value: string) => {
    setHan(value === "" ? undefined : Number(value));
  };

  const handleFuChange = (value: string) => {
    setFu(value === "" ? undefined : Number(value));
  };

  const filterScores = (
    scores: readonly number[],
    type: ScoreFilterType,
  ): readonly number[] => {
    if (han === undefined) return scores;
    const isManganFixed = han >= 5;
    if (isManganFixed) {
      switch (type) {
        case "ronKo":
          return scores.filter((s) => s >= 8000);
        case "ronOya":
          return scores.filter((s) => s >= 12000);
        case "tsumoKoKo":
          return scores.filter((s) => s >= 2000);
        case "tsumoKoOya":
          return scores.filter((s) => s >= 4000);
        case "tsumoOyaAll":
          return scores.filter((s) => s >= 4000);
      }
    }
    if (han <= 3) {
      switch (type) {
        case "ronKo":
          return scores.filter((s) => s < 8000);
        case "ronOya":
          return scores.filter((s) => s < 12000);
        case "tsumoKoKo":
          return scores.filter((s) => s < 2000);
        case "tsumoKoOya":
          return scores.filter((s) => s < 4000);
        case "tsumoOyaAll":
          return scores.filter((s) => s < 4000);
      }
    }
    return scores;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (han === undefined) return;
    if (isFuRequired && fu === undefined) return;

    const submitYakus = requireYaku ? yakus : [];
    const submitFu = isFuRequired ? fu : isMangan ? undefined : fu;

    if (isKoTsumo) {
      const koScore = parseInt(scoreFromKo, 10);
      const oyaScore = parseInt(scoreFromOya, 10);
      if (isNaN(koScore) || isNaN(oyaScore)) return;

      onSubmit({
        han,
        fu: submitFu,
        scoreFromKo: koScore,
        scoreFromOya: oyaScore,
        yakus: submitYakus,
      });
    } else {
      const scoreNum = parseInt(score, 10);
      if (isNaN(scoreNum)) return;

      onSubmit({
        han,
        fu: submitFu,
        score: scoreNum,
        yakus: submitYakus,
      });
    }
  };

  const selectClass = (hasValue: boolean) =>
    `w-full rounded-lg border border-surface-300 bg-white px-2 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 disabled:bg-surface-100 ${
      hasValue ? "text-surface-900" : "text-surface-400"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Yaku input */}
      {requireYaku && (
        <YakuSelect value={yakus} onChange={setYakus} disabled={disabled} />
      )}

      {/* Han input */}
      <div>
        <label className="mb-2 block text-sm font-bold text-surface-700">
          {t("form.labels.han")}
        </label>
        <select
          value={han ?? ""}
          onChange={(e) => handleHanChange(e.target.value)}
          disabled={disabled}
          required
          className={selectClass(han !== undefined)}
        >
          {hanOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Fu input */}
      {isFuRequired && (
        <div>
          <label className="mb-2 block text-sm font-bold text-surface-700">
            {t("form.labels.fu")}
          </label>
          <select
            value={fu ?? ""}
            onChange={(e) => handleFuChange(e.target.value)}
            disabled={disabled}
            required
            className={selectClass(fu !== undefined)}
          >
            {fuOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {!isFuRequired && isMangan && (
        <div className="text-sm italic text-surface-500">
          {t("form.messages.fuNotRequired")}
        </div>
      )}

      {/* Score input */}
      <div>
        <label className="mb-2 block text-sm font-bold text-surface-700">
          {t("form.labels.score")}
        </label>
        {isKoTsumo ? (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <select
                value={scoreFromKo}
                onChange={(e) => setScoreFromKo(e.target.value)}
                disabled={disabled}
                required
                className={selectClass(scoreFromKo !== "")}
              >
                <option value="" disabled>
                  {t("form.placeholders.fromKo")}
                </option>
                {filterScores(TSUMO_SCORES_KO_PART, "tsumoKoKo").map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <span className="font-medium text-surface-500">/</span>
            <div className="flex-1">
              <select
                value={scoreFromOya}
                onChange={(e) => setScoreFromOya(e.target.value)}
                disabled={disabled}
                required
                className={selectClass(scoreFromOya !== "")}
              >
                <option value="" disabled>
                  {t("form.placeholders.fromOya")}
                </option>
                {filterScores(TSUMO_SCORES_OYA_PART, "tsumoKoOya").map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <select
            value={score}
            onChange={(e) => setScore(e.target.value)}
            disabled={disabled}
            required
            className={selectClass(score !== "")}
          >
            <option value="" disabled>
              {t("form.placeholders.select")}
            </option>
            {filterScores(
              isOya && isTsumo
                ? TSUMO_SCORES_OYA_PART
                : isOya
                  ? RON_SCORES_OYA
                  : RON_SCORES_KO,
              isOya && isTsumo
                ? "tsumoOyaAll"
                : isOya
                  ? "ronOya"
                  : "ronKo",
            ).map((s) => (
              <option key={s} value={s}>
                {s}
                {isOya && isTsumo ? t("form.options.all") : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-lg bg-primary-500 py-3 px-6 font-bold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-surface-400 disabled:text-surface-200"
      >
        {t("form.buttons.answer")}
      </button>

      {/* Skip */}
      {onSkip && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-surface-500 underline hover:text-surface-700"
          >
            {t("form.buttons.skip")}
          </button>
        </div>
      )}

      {/* Exit */}
      {onExit && (
        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={onExit}
            className="text-sm text-surface-500 underline hover:text-surface-600"
          >
            {t("form.buttons.exit")}
          </button>
        </div>
      )}
    </form>
  );
}
