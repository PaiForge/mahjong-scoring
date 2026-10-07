"use client";

import { useMemo, useState } from "react";
import { paymentKindOf } from "@mahjong-scoring/core";
import type { UserAnswer } from "@mahjong-scoring/core";
import {
  getAvailableScores,
  type AvailableScores,
} from "./get-available-scores";
import { MANGAN_MIN_HAN } from "./han-tiers";

/** 入力欄の中身（prefill から起こすため 1 つの型にまとめる） */
interface FormFields {
  readonly han: number | undefined;
  readonly fu: number | undefined;
  readonly yakus: readonly string[];
  readonly score: number | undefined;
  readonly scoreFromKo: number | undefined;
  readonly scoreFromOya: number | undefined;
}

const EMPTY_FIELDS: FormFields = {
  han: undefined,
  fu: undefined,
  yakus: [],
  score: undefined,
  scoreFromKo: undefined,
  scoreFromOya: undefined,
};

function fieldsOf(prefill: UserAnswer | undefined): FormFields {
  if (!prefill) return EMPTY_FIELDS;
  return {
    han: prefill.han,
    fu: prefill.fu,
    yakus: prefill.yakus,
    score: prefill.score,
    scoreFromKo: prefill.scoreFromKo,
    scoreFromOya: prefill.scoreFromOya,
  };
}

export interface UseScorePracticeAnswerFormParams {
  readonly onSubmit: (answer: UserAnswer) => void;
  readonly isTsumo: boolean;
  readonly isOya: boolean;
  /** 役も答えさせるか */
  readonly requireYaku: boolean;
  /** 満貫以上でも符を答えさせるか */
  readonly requireFuForMangan: boolean;
  /** 端末のルール設定の切り上げ満貫 */
  readonly kiriageMangan: boolean;
  /** ダブル役満を採用したルールか（翻数・点数の選択肢にダブル役満を足す） */
  readonly allowDoubleYakuman: boolean;
  /**
   * 入力欄の初期値。変わったら、まだ触っていない欄をその中身に合わせる
   * （聴牌形の点数計算で同じ答えのマスをまとめて選んだとき、共通の答えを入れておく）
   */
  readonly prefill?: UserAnswer;
}

export interface UseScorePracticeAnswerFormResult extends FormFields {
  readonly setHan: (han: number | undefined) => void;
  readonly setFu: (fu: number | undefined) => void;
  readonly setYakus: (yakus: readonly string[]) => void;
  readonly setScore: (score: number) => void;
  readonly setScoreFromKo: (score: number) => void;
  readonly setScoreFromOya: (score: number) => void;
  /** 符を答えさせるか（満貫以上は符が点数に効かないので、設定が無ければ問わない） */
  readonly isFuRequired: boolean;
  readonly availableScores: AvailableScores;
  /** 親ツモか（点数の選択肢に「オール」を添える） */
  readonly isOyaTsumo: boolean;
  /**
   * 入力が揃ったか。揃うまで回答ボタンを押せなくする — 押せるのに何も
   * 起きない状態を作らないため
   */
  readonly isComplete: boolean;
  /** 回答を送る。入力が揃っていなければ何もしない */
  readonly submit: () => void;
}

/**
 * 点数計算の無限訓練の回答フォームの状態（役・翻・符・点数）
 * 点数訓練回答フォーム状態
 *
 * 入力欄の値と prefill への追従、符を問うか、点数の選択肢、入力が揃ったか、
 * 送る回答の組み立てを持つ。和了形・聴牌形の点数計算の両方で使う。
 */
export function useScorePracticeAnswerForm({
  onSubmit,
  isTsumo,
  isOya,
  requireYaku,
  requireFuForMangan,
  kiriageMangan,
  allowDoubleYakuman,
  prefill,
}: UseScorePracticeAnswerFormParams): UseScorePracticeAnswerFormResult {
  const [fields, setFields] = useState(() => fieldsOf(prefill));
  // ユーザーが欄を触ったか。触った後は prefill の変化を無視する
  const [touched, setTouched] = useState(false);

  // prefill が変わったら、触っていない欄をその中身に合わせる。effect では
  // なく render 中に state を合わせる（React の「prop の変化で state を
  // 調整する」パターン。effect だと 1 度古い中身で描いてから直すことになる）
  const [appliedPrefill, setAppliedPrefill] = useState(prefill);
  if (prefill !== appliedPrefill) {
    setAppliedPrefill(prefill);
    if (!touched) setFields(fieldsOf(prefill));
  }

  const update =
    <K extends keyof FormFields>(key: K) =>
    (value: FormFields[K]) => {
      setTouched(true);
      setFields((prev) => ({ ...prev, [key]: value }));
    };

  const { han, fu, yakus, score, scoreFromKo, scoreFromOya } = fields;
  const isMangan = han !== undefined && han >= MANGAN_MIN_HAN;
  const isFuRequired = !isMangan || requireFuForMangan;

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

  const isComplete =
    han !== undefined &&
    (!isFuRequired || fu !== undefined) &&
    (availableScores.type === "koTsumo"
      ? scoreFromKo !== undefined && scoreFromOya !== undefined
      : score !== undefined);

  const submit = () => {
    if (han === undefined) return;
    if (isFuRequired && fu === undefined) return;

    const submitYakus = requireYaku ? [...yakus] : [];
    const submitFu = isFuRequired ? fu : isMangan ? undefined : fu;

    if (availableScores.type === "koTsumo") {
      if (scoreFromKo === undefined || scoreFromOya === undefined) return;
      onSubmit({
        han,
        fu: submitFu,
        scoreFromKo,
        scoreFromOya,
        yakus: submitYakus,
      });
    } else {
      if (score === undefined) return;
      onSubmit({ han, fu: submitFu, score, yakus: submitYakus });
    }
  };

  return {
    ...fields,
    setHan: update("han"),
    setFu: update("fu"),
    setYakus: update("yakus"),
    setScore: update("score"),
    setScoreFromKo: update("scoreFromKo"),
    setScoreFromOya: update("scoreFromOya"),
    isFuRequired,
    availableScores,
    isOyaTsumo: paymentKindOf(isOya, isTsumo) === "oyaTsumo",
    isComplete,
    submit,
  };
}
