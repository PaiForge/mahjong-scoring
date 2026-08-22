"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FU_VALUES } from "@mahjong-scoring/core";
import type { UserAnswer } from "@mahjong-scoring/core";
import { YakuSelect } from "./yaku-select";
import { getAvailableScores } from "../_lib/get-available-scores";
import { MANGAN_MIN_HAN, PRACTICE_HAN_TIERS } from "../_lib/han-tiers";
import { getSelectClass } from "../../_lib/select-class";
import { ScoreOptionSelect } from "../../_components/score-option-select";
import { Button } from "@/app/_components/button";

interface ScorePracticeAnswerFormProps {
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

/**
 * 回答フォームコンポーネント
 * 回答フォーム
 */
export function ScorePracticeAnswerForm({
  onSubmit,
  disabled = false,
  isTsumo,
  isOya,
  requireYaku = false,
  simplifyMangan = false,
  requireFuForMangan = false,
  onSkip,
  onExit,
}: ScorePracticeAnswerFormProps) {
  const t = useTranslations("score");
  const [han, setHan] = useState<number | undefined>(undefined);
  const [fu, setFu] = useState<number | undefined>(undefined);
  const [yakus, setYakus] = useState<string[]>([]);
  const [score, setScore] = useState<string>("");
  const [scoreFromKo, setScoreFromKo] = useState<string>("");
  const [scoreFromOya, setScoreFromOya] = useState<string>("");

  const isMangan = han !== undefined && han >= MANGAN_MIN_HAN;
  const isFuRequired = !isMangan || requireFuForMangan;
  const isKoTsumo = isTsumo && !isOya;

  const hanOptions = useMemo(() => {
    // 満貫以上の区分は翻数しきい値の昇順で並べる（PRACTICE_HAN_TIERS は降順）
    const manganPlusOptions = [...PRACTICE_HAN_TIERS].reverse().map((tier) => ({
      value: tier.minHan,
      label: t(`form.options.${tier.key}`),
    }));

    if (simplifyMangan) {
      return [
        { value: "", label: t("form.placeholders.select") },
        ...Array.from({ length: MANGAN_MIN_HAN - 1 }, (_, i) => ({
          value: i + 1,
          label: `${i + 1}${t("form.options.hanSuffix")}`,
        })),
        ...manganPlusOptions,
      ];
    }

    const yakumanOption = manganPlusOptions[manganPlusOptions.length - 1]!;
    return [
      { value: "", label: t("form.placeholders.select") },
      ...Array.from({ length: yakumanOption.value - 1 }, (_, i) => ({
        value: i + 1,
        label: `${i + 1}${t("form.options.hanSuffix")}`,
      })),
      yakumanOption,
    ];
  }, [simplifyMangan, t]);

  const fuOptions = useMemo(
    () => [
      { value: "", label: t("form.placeholders.select") },
      ...FU_VALUES.map((v) => ({
        value: v,
        label: `${v}${t("form.options.fuSuffix")}`,
      })),
    ],
    [t],
  );

  const handleHanChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setHan(value === "" ? undefined : Number(value));
    },
    [],
  );

  const handleFuChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setFu(value === "" ? undefined : Number(value));
    },
    [],
  );

  const availableScores = useMemo(
    () => getAvailableScores(han, isOya, isTsumo),
    [han, isOya, isTsumo],
  );

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

  const selectClass = getSelectClass;

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
          onChange={handleHanChange}
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
            onChange={handleFuChange}
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
        {availableScores.type === "koTsumo" ? (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ScoreOptionSelect
                value={scoreFromKo}
                onChange={setScoreFromKo}
                options={availableScores.koScores}
                placeholder={t("form.placeholders.fromKo")}
                disabled={disabled}
              />
            </div>
            <span className="font-medium text-surface-500">/</span>
            <div className="flex-1">
              <ScoreOptionSelect
                value={scoreFromOya}
                onChange={setScoreFromOya}
                options={availableScores.oyaScores}
                placeholder={t("form.placeholders.fromOya")}
                disabled={disabled}
              />
            </div>
          </div>
        ) : (
          <ScoreOptionSelect
            value={score}
            onChange={setScore}
            options={availableScores.scores}
            placeholder={t("form.placeholders.select")}
            disabled={disabled}
            optionSuffix={isOya && isTsumo ? t("form.options.all") : ""}
          />
        )}
      </div>

      {/* Submit */}
      <Button type="submit" size="lg" fullWidth disabled={disabled}>
        {t("form.buttons.answer")}
      </Button>

      {/* Skip */}
      {onSkip && (
        <div className="text-center">
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
        <div className="text-center">
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
