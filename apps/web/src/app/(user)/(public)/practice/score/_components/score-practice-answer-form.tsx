"use client";

import { useMemo, useCallback, useId } from "react";
import { useTranslations } from "next-intl";
import { allowsDoubleYakuman } from "@mahjong-scoring/core";
import type { UserAnswer } from "@mahjong-scoring/core";
import { YakuLabelRow, YakuSelect } from "./yaku-select";
import {
  useRuleSettingsStore,
  useYakumanRules,
} from "@/app/_hooks/use-rule-settings-store";
import {
  practiceFuOptions,
  practiceHanOptions,
} from "@mahjong-scoring/features/practice/score/answer-options";
import { useScorePracticeAnswerForm } from "@mahjong-scoring/features/practice/score/use-score-practice-answer-form";
import { getSelectClass } from "../../_lib/select-class";
import { ScoreOptionSelect } from "../../_components/score-option-select";
import { Button } from "@/app/(user)/_components/button";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SCORE_TOUR_ID } from "../_lib/tour-ids";

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
   * （聴牌形の点数計算が立てる。和了形の点数計算は役の回答が必要なときだけ行が出る）
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
  /**
   * 入力欄に読み込んでおく回答。まだ何も入力していない間だけ効く
   *
   * 聴牌形の点数計算で「回答済みのマスを選択に加える」と、そのマスの回答が
   * ここに渡り、翻・符・点数（役）が入った状態になる — 同じ点数の待ちを
   * 後からまとめ直すときや、まとめて答えた符だけ直すときに、同じ内容を
   * select で入れ直さずに済む。値が変わるたびに欄を合わせる（1 種類に
   * 定まらなくなって undefined になれば空に戻す）が、ユーザーが 1 度でも
   * 欄を触ったあとは無視する — 入力の途中で回答済みのマスを誤タップした
   * 拍子に、入れかけの内容が置き換わってはいけない。触った記録は
   * mount ごと（親が key で作り直すたび）にリセットされる
   */
  readonly prefill?: UserAnswer;
}

/**
 * 回答フォームコンポーネント
 * 回答フォーム
 *
 * 各欄には和了形の点数計算のヘルプツアーが照らす印（`SCORE_TOUR_ID`）を付ける。
 * 聴牌形の点数計算もこのフォームを使うが、そちらのツアーはフォーム全体を
 * 1 つの対象として照らすので、欄ごとの印は引かれない。
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
  prefill,
}: ScorePracticeAnswerFormProps) {
  const t = useTranslations("score");
  // ラベルと select を紐付ける id（読み上げで「翻数」「符」「点数」を名前として得るため）
  const hanId = useId();
  const fuId = useId();
  const scoreId = useId();
  const scoreLabelId = useId();
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  // ダブル役満を採用したルールでは、翻数・点数の選択肢にダブル役満を足す
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());
  const {
    han,
    fu,
    yakus,
    score,
    scoreFromKo,
    scoreFromOya,
    setHan,
    setFu,
    setYakus,
    setScore,
    setScoreFromKo,
    setScoreFromOya,
    isFuRequired,
    availableScores,
    isOyaTsumo,
    isComplete,
    submit,
  } = useScorePracticeAnswerForm({
    onSubmit,
    isTsumo,
    isOya,
    requireYaku,
    requireFuForMangan,
    kiriageMangan,
    allowDoubleYakuman,
    prefill,
  });

  const hanOptions = useMemo(
    () => [
      { value: "", label: t("form.placeholders.select") },
      ...practiceHanOptions(t, simplifyMangan, allowDoubleYakuman),
    ],
    [simplifyMangan, allowDoubleYakuman, t],
  );

  /** 符が不要なとき、符の select にそのまま描く注記（箱の高さを保つため） */
  const fuNotRequiredOptions = useMemo(
    () => [{ value: "", label: t("form.messages.fuNotRequired") }],
    [t],
  );

  const fuOptions = useMemo(
    () => [
      { value: "", label: t("form.placeholders.select") },
      ...practiceFuOptions(t),
    ],
    [t],
  );

  const handleHanChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setHan(value === "" ? undefined : Number(value));
    },
    [setHan],
  );

  const handleFuChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setFu(value === "" ? undefined : Number(value));
    },
    [setFu],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
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
            <div data-tour-id={SCORE_TOUR_ID.yaku}>
              <YakuSelect
                value={yakus}
                onChange={setYakus}
                disabled={disabled}
                labelAction={noYakuButton}
              />
            </div>
          );
        }
        return reserveYakuRow ? <YakuLabelRow action={noYakuButton} /> : null;
      })()}

      {/* Han input */}
      <div data-tour-id={SCORE_TOUR_ID.han}>
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
      <div data-tour-id={SCORE_TOUR_ID.fu}>
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
      <div data-tour-id={SCORE_TOUR_ID.score}>
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
            optionSuffix={isOyaTsumo ? t("form.options.all") : ""}
          />
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        fullWidth
        disabled={disabled || !isComplete}
        data-tour-id={SCORE_TOUR_ID.submit}
      >
        {submitLabel ?? t("form.buttons.answer")}
      </Button>
    </form>
  );
}
