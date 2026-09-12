"use client";

import { useState, useMemo, useCallback, useId } from "react";
import { useTranslations } from "next-intl";
import {
  allowsDoubleYakuman,
  FU_VALUES,
  paymentKindOf,
  YAKUMAN_HAN,
} from "@mahjong-scoring/core";
import type { UserAnswer } from "@mahjong-scoring/core";
import { YakuLabelRow, YakuSelect } from "./yaku-select";
import {
  useRuleSettingsStore,
  useYakumanRules,
} from "@/app/_hooks/use-rule-settings-store";
import { getAvailableScores } from "../_lib/get-available-scores";
import { MANGAN_MIN_HAN, practiceHanTiers } from "../_lib/han-tiers";
import { getSelectClass } from "../../_lib/select-class";
import { ScoreOptionSelect } from "../../_components/score-option-select";
import { Button } from "@/app/(user)/_components/button";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

interface ScorePracticeAnswerFormProps {
  readonly onSubmit: (answer: UserAnswer) => void;
  readonly disabled?: boolean;
  readonly isTsumo: boolean;
  readonly isOya: boolean;
  readonly requireYaku?: boolean;
  readonly simplifyMangan?: boolean;
  readonly requireFuForMangan?: boolean;
  /** 回答ボタンの文言。既定は「回答する」 */
  readonly submitLabel?: string;
  /**
   * 「役」のラベル行を役の回答が不要でも出す。「役なし」のチェックボックスの
   * 置き場をツモ・ロンの別によらず確保し、フォームの高さを変えないため
   * （待ち別点数計算が立てる。総合演習は役の回答が必要なときだけ行が出る）
   */
  readonly reserveYakuRow?: boolean;
  /**
   * 「役なし（ロンできない）」を回答として選べるようにする。指定すると「役」の
   * ラベル行の右端にリンク風のボタンを出し、押した時点で `onSelect` を呼ぶ。
   * 役なしは押した瞬間に回答として完結する（翻・符・点数に入れるものが
   * 無い）ので、回答ボタンを経由させない — チェックボックスにして回答
   * ボタンで確定させる形は、チェックだけで答えたつもりになるうえ、選択中の
   * マスを足すとフォームが作り直されてチェックが黙って外れた。ロンにしか
   * 無い回答なので、ツモのマスを答えるときは渡さない（`reserveYakuRow` と
   * 組めば行の高さは変わらず、ラベル行の右側が空くだけ）
   */
  readonly noYaku?: {
    readonly label: string;
    readonly onSelect: () => void;
  };
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
  submitLabel,
  reserveYakuRow = false,
  noYaku,
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
  const paymentKind = paymentKindOf(isOya, isTsumo);
  const isKoTsumo = paymentKind === "koTsumo";

  // ダブル役満を採用したルールでは、翻数・点数の選択肢にダブル役満を足す
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());

  const hanOptions = useMemo(() => {
    // 満貫以上の区分は翻数しきい値の昇順で並べる（practiceHanTiers は降順）
    const manganPlusOptions = [...practiceHanTiers(allowDoubleYakuman)]
      .reverse()
      .map((tier) => ({
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

    // 簡略化しないモードでは役満未満は数値で出し、役満以上
    // （役満・ダブル役満採用時はダブル役満も）だけ区分名で出す
    const yakumanPlusOptions = manganPlusOptions.filter(
      (option) => option.value >= YAKUMAN_HAN,
    );
    return [
      { value: "", label: t("form.placeholders.select") },
      ...Array.from({ length: YAKUMAN_HAN - 1 }, (_, i) => ({
        value: i + 1,
        label: `${i + 1}${t("form.options.hanSuffix")}`,
      })),
      ...yakumanPlusOptions,
    ];
  }, [simplifyMangan, allowDoubleYakuman, t]);

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
    () =>
      getAvailableScores(
        han,
        isOya,
        isTsumo,
        undefined,
        kiriageMangan,
        allowDoubleYakuman,
      ),
    [han, isOya, isTsumo, kiriageMangan, allowDoubleYakuman],
  );

  // 入力が揃うまで回答ボタンを押せなくする。押せるのに何も起きない状態を
  // 作らないため — HTML の required は iOS Safari では効かず、揃っていない
  // 入力で押すと黙って何も起きなかった
  const isComplete =
    han !== undefined &&
    (!isFuRequired || fu !== undefined) &&
    (isKoTsumo
      ? !isNaN(parseInt(scoreFromKo, 10)) && !isNaN(parseInt(scoreFromOya, 10))
      : !isNaN(parseInt(score, 10)));

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
      {/* Yaku input
          「役なし」はロンにしか無い回答なので、「役」のラベル行の右端に
          添える（渡されたときだけ）。リンク風のボタンで、押した瞬間に回答が
          確定する。役の回答が不要な設定でも
          reserveYakuRow ならラベル行だけを出し、ツモとロンでフォームの
          高さが変わらないようにする */}
      {(() => {
        const noYakuButton = noYaku && (
          <button
            type="button"
            disabled={disabled}
            onClick={noYaku.onSelect}
            className={`text-xs ${TEXT_LINK_CLASSES}`}
          >
            {noYaku.label}
          </button>
        );
        if (requireYaku) {
          return (
            <YakuSelect
              value={yakus}
              onChange={setYakus}
              disabled={disabled}
              labelAction={noYakuButton}
            />
          );
        }
        return reserveYakuRow ? <YakuLabelRow action={noYakuButton} /> : null;
      })()}

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
            optionSuffix={
              paymentKind === "oyaTsumo" ? t("form.options.all") : ""
            }
          />
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        fullWidth
        disabled={disabled || !isComplete}
      >
        {submitLabel ?? t("form.buttons.answer")}
      </Button>
    </form>
  );
}
