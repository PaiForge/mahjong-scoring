"use client";

import { useState, useMemo, useCallback, useId } from "react";
import { useTranslations } from "next-intl";
import { FU_VALUES } from "@mahjong-scoring/core";
import type { UserAnswer } from "@mahjong-scoring/core";
import { YakuSelect } from "./yaku-select";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { getAvailableScores } from "../_lib/get-available-scores";
import { MANGAN_MIN_HAN, PRACTICE_HAN_TIERS } from "../_lib/han-tiers";
import { getSelectClass } from "../../_lib/select-class";
import { ScoreOptionSelect } from "../../_components/score-option-select";
import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "../../_components/practice-footer-actions";
import { Button } from "@/app/(user)/_components/button";

interface ScorePracticeAnswerFormProps {
  readonly onSubmit: (answer: UserAnswer) => void;
  readonly disabled?: boolean;
  readonly isTsumo: boolean;
  readonly isOya: boolean;
  readonly requireYaku?: boolean;
  readonly simplifyMangan?: boolean;
  readonly requireFuForMangan?: boolean;
  /** 「わからない」操作（無回答のまま正解を開示する）。指定時のみリンクを出す */
  readonly onReveal?: () => void;
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
  onReveal,
}: ScorePracticeAnswerFormProps) {
  const t = useTranslations("score");
  // ラベルと select を紐付ける id（読み上げで「翻数」「符」「点数」を名前として得るため）
  const hanId = useId();
  const fuId = useId();
  const scoreId = useId();
  const scoreLabelId = useId();
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

  /** 符が不要なとき、符の select にそのまま描く注記（箱の高さを保つため） */
  const fuNotRequiredOptions = useMemo(
    () => [{ value: "", label: t("form.messages.fuNotRequired") }],
    [t],
  );

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

  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  const availableScores = useMemo(
    () => getAvailableScores(han, isOya, isTsumo, undefined, kiriageMangan),
    [han, isOya, isTsumo, kiriageMangan],
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
        <label
          htmlFor={hanId}
          className="mb-2 block text-sm font-bold text-surface-700"
        >
          {t("form.labels.han")}
        </label>
        <select
          id={hanId}
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

      {/* Fu input
          満貫以上で符が不要になっても、select を 1 行の注記に差し替えず disabled の
          まま残す。差し替えるとブロックの高さが約 58px 縮み、翻数を選んだ直後に
          触る「点数」と回答ボタンが指の下でせり上がる。注記は select の唯一の
          option として同じ箱に描くため、高さは要素が同一であることで一致する。 */}
      <div>
        <label
          htmlFor={fuId}
          className="mb-2 block text-sm font-bold text-surface-700"
        >
          {t("form.labels.fu")}
        </label>
        <select
          id={fuId}
          value={isFuRequired ? (fu ?? "") : ""}
          onChange={handleFuChange}
          disabled={disabled || !isFuRequired}
          required={isFuRequired}
          className={selectClass(isFuRequired ? fu !== undefined : true)}
        >
          {(isFuRequired ? fuOptions : fuNotRequiredOptions).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Score input
          子ツモは「点数」ラベル 1 つに対し select が 2 つあるため、
          ラベルは group の名前として使い、各 select は「子」「親」で名付ける。 */}
      <div>
        <label
          htmlFor={availableScores.type === "koTsumo" ? undefined : scoreId}
          id={scoreLabelId}
          className="mb-2 block text-sm font-bold text-surface-700"
        >
          {t("form.labels.score")}
        </label>
        {availableScores.type === "koTsumo" ? (
          <div
            role="group"
            aria-labelledby={scoreLabelId}
            className="flex items-center gap-2"
          >
            <div className="flex-1">
              <ScoreOptionSelect
                value={scoreFromKo}
                onChange={setScoreFromKo}
                options={availableScores.koScores}
                placeholder={t("form.placeholders.fromKo")}
                ariaLabel={t("form.placeholders.fromKo")}
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
                ariaLabel={t("form.placeholders.fromOya")}
                disabled={disabled}
              />
            </div>
          </div>
        ) : (
          <ScoreOptionSelect
            id={scoreId}
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

      {/* Reveal（わからない）: 無回答のまま正解を開示する */}
      {onReveal && (
        <PracticeFooterActions>
          <PracticeFooterAction onClick={onReveal}>
            {t("form.buttons.reveal")}
          </PracticeFooterAction>
        </PracticeFooterActions>
      )}
    </form>
  );
}
