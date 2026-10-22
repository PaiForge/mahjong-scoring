"use client";

import { useId, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  practiceFuOptions,
  practiceHanOptions,
} from "@mahjong-scoring/features/practice/score/answer-options";
import type { UseScorePracticeAnswerFormResult } from "@mahjong-scoring/features/practice/score/use-score-practice-answer-form";
import { getSelectClass } from "../../_lib/select-class";
import { AGARI_SCORE_TOUR_ID } from "../_lib/tour-ids";

/**
 * 回答フォームの翻数と符の欄
 * 翻数・符の欄
 *
 * 満貫以上で符が不要になっても、select を 1 行の注記に差し替えず disabled の
 * まま残す。差し替えるとブロックの高さが約 58px 縮み、翻数を選んだ直後に
 * 触る「点数」と回答ボタンが指の下でせり上がる。注記は select の唯一の
 * option として同じ箱に描くため、高さは要素が同一であることで一致する。
 */
export function HanFuFields({
  form,
  exactHan,
  allowDoubleYakuman,
  disabled,
}: {
  readonly form: Pick<
    UseScorePracticeAnswerFormResult,
    "han" | "fu" | "setHan" | "setFu" | "isFuRequired"
  >;
  readonly exactHan: boolean;
  readonly allowDoubleYakuman: boolean;
  readonly disabled: boolean;
}) {
  const t = useTranslations("agariScore");
  // ラベルと select を紐付ける id（読み上げで「翻数」「符」を名前として得るため）
  const hanId = useId();
  const fuId = useId();
  const { han, fu, setHan, setFu, isFuRequired } = form;

  const hanOptions = useMemo(
    () => [
      { value: "", label: t("form.placeholders.select") },
      ...practiceHanOptions(t, exactHan, allowDoubleYakuman),
    ],
    [exactHan, allowDoubleYakuman, t],
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
  const toNumber = (value: string) =>
    value === "" ? undefined : Number(value);

  return (
    <>
      <div data-tour-id={AGARI_SCORE_TOUR_ID.han}>
        <label
          htmlFor={hanId}
          className="mb-2 block text-sm font-bold text-surface-700"
        >
          {t("form.labels.han")}
        </label>
        <select
          id={hanId}
          value={han ?? ""}
          onChange={(e) => setHan(toNumber(e.target.value))}
          disabled={disabled}
          required
          className={getSelectClass(han !== undefined)}
        >
          {hanOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div data-tour-id={AGARI_SCORE_TOUR_ID.fu}>
        <label
          htmlFor={fuId}
          className="mb-2 block text-sm font-bold text-surface-700"
        >
          {t("form.labels.fu")}
        </label>
        <select
          id={fuId}
          value={isFuRequired ? (fu ?? "") : ""}
          onChange={(e) => setFu(toNumber(e.target.value))}
          disabled={disabled || !isFuRequired}
          required={isFuRequired}
          className={getSelectClass(isFuRequired ? fu !== undefined : true)}
        >
          {(isFuRequired ? fuOptions : fuNotRequiredOptions).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
