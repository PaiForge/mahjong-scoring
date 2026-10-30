"use client";

import { useMemo, useState } from "react";
import { paymentKindOf } from "@mahjong-scoring/core";
import type { KoTsumoPayment, UserAnswer } from "@mahjong-scoring/core";
import type { KoTsumoInputMode } from "../../settings/ko-tsumo-input";
import {
  getAvailableScores,
  type AvailableScores,
} from "./get-available-scores";
import { MANGAN_MIN_HAN } from "./han-tiers";
import { resolveScoreSelection } from "./score-selection";

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
  /** 翻数と符も答えさせるか（答えさせないときは点数だけを問う） */
  readonly requireHanFu: boolean;
  /** 満貫以上でも符を答えさせるか */
  readonly requireFuForMangan: boolean;
  /** 端末のルール設定の切り上げ満貫 */
  readonly kiriageMangan: boolean;
  /** ダブル役満を採用したルールか（翻数・点数の選択肢にダブル役満を足す） */
  readonly allowDoubleYakuman: boolean;
  /** 子ツモの入力方式（端末の表示設定。アプリ側がストアから読んで渡す） */
  readonly koTsumoInput: KoTsumoInputMode;
  /**
   * 点数を選んだ時点で送る（既定 false）
   * 選択即送信
   *
   * 点数だけを問う設定（役も翻数・符も答えない）のときに立てる。点数の
   * 選択肢をタップする練習（符・翻数・役）と、点数だけを答えるチャレンジ・
   * 昇級試験は押した時点で答えになるので、同じ格子のタイルで「押しても
   * 送られない」画面を作らない。他の欄も答える設定では、点数が最後の欄とは
   * 限らず（符を先に選んだ人が後から点数を直す）、揃った瞬間に送ると
   * 直せないので立てない。立てるかどうかはフォームが決め、ここは
   * 「点数の選択が揃ったら送る」だけを持つ。
   *
   * 設定にはしない — 誤タップの心配は選択肢をタップする練習すべてに同じ
   * ようにあり、そこに設定は置いていない。操作の形の設定（点数・子ツモの
   * 入力方式）を増やすと組み合わせごとに web とアプリで確かめる筋が増える
   */
  readonly autoSubmit?: boolean;
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
  /** 子ツモをまとめた select で組を選ぶ（子から・親からを同時に入れる） */
  readonly setKoTsumoPayment: (payment: KoTsumoPayment) => void;
  /** 子ツモをまとめた select で選ばれている組 */
  readonly koTsumoPayment: KoTsumoPayment | undefined;
  /**
   * 符を答えさせるか（翻数と符を問わない設定では問わない。満貫以上は符が
   * 点数に効かないので、設定が無ければ問わない）
   */
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
  /**
   * 「回答する」ボタンを出すか。選択即送信（`autoSubmit`）なら出さない —
   * 選んだ時点で送られるので、押しても何も起きないボタンになる
   */
  readonly showsSubmitButton: boolean;
}

/**
 * 点数計算の無限訓練の回答フォームの状態（役・翻・符・点数）
 * 点数訓練回答フォーム状態
 *
 * 入力欄の値と prefill への追従、符を問うか、点数の選択肢、入力が揃ったか、
 * 送る回答の組み立てを持つ。和了形・聴牌形の点数計算の両方で使う。
 *
 * 返す点数（`score` / `scoreFromKo` / `scoreFromOya`）・`isComplete`・送る回答は、
 * どれも今の選択肢に存在する値だけを見る（{@link resolveScoreSelection}）。
 * 読み込んだ回答が分割入力で入れた実在しない組だったときや、翻数を変えて
 * 選んでいた点数が選択肢から外れたときは未選択に見え、選び直すまで送れない。
 */
export function useScorePracticeAnswerForm({
  onSubmit,
  isTsumo,
  isOya,
  requireYaku,
  requireHanFu,
  requireFuForMangan,
  kiriageMangan,
  allowDoubleYakuman,
  koTsumoInput,
  autoSubmit = false,
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

  const { fu } = fields;
  // 翻数を問わないときは、入力欄に残った値（prefill 等）も無いものとして扱う。
  // 点数の選択肢を翻数で絞らず、取りうる全点数から選ばせるため
  const han = requireHanFu ? fields.han : undefined;
  const isMangan = han !== undefined && han >= MANGAN_MIN_HAN;
  const isFuRequired = requireHanFu && (!isMangan || requireFuForMangan);

  const availableScores = useMemo(
    () =>
      getAvailableScores({
        han,
        isOya,
        isTsumo,
        kiriageMangan,
        doubleYakuman: allowDoubleYakuman,
        koTsumoInput,
      }),
    [han, isOya, isTsumo, kiriageMangan, allowDoubleYakuman, koTsumoInput],
  );
  const selection = resolveScoreSelection(availableScores, fields);
  const { score, scoreFromKo, scoreFromOya } = selection;

  const isComplete =
    (!requireHanFu || han !== undefined) &&
    (!isFuRequired || fu !== undefined) &&
    selection.isComplete;

  /**
   * 欄の中身から送る回答を組み立てる（揃っていなければ undefined）
   *
   * 翻数（`han`）と選択肢（`availableScores`）は今の render のものを使う。
   * 選択即送信は点数の欄の書き換えでしか起きず、そのとき翻数は変わらない
   */
  const answerOf = (f: FormFields): UserAnswer | undefined => {
    if (requireHanFu && han === undefined) return undefined;
    if (isFuRequired && f.fu === undefined) return undefined;

    const submitYakus = requireYaku ? [...f.yakus] : [];
    const submitFu = isFuRequired
      ? f.fu
      : isMangan || !requireHanFu
        ? undefined
        : f.fu;
    const s = resolveScoreSelection(availableScores, f);

    if (availableScores.type !== "single") {
      if (s.scoreFromKo === undefined || s.scoreFromOya === undefined)
        return undefined;
      return {
        han,
        fu: submitFu,
        scoreFromKo: s.scoreFromKo,
        scoreFromOya: s.scoreFromOya,
        yakus: submitYakus,
      };
    }
    if (s.score === undefined) return undefined;
    return { han, fu: submitFu, score: s.score, yakus: submitYakus };
  };

  const submit = () => {
    const answer = answerOf(fields);
    if (answer) onSubmit(answer);
  };

  // 点数の欄を書き換え、選択即送信なら書き換えた後の回答が揃った時点で送る
  const selectScore = (patch: Partial<FormFields>) => {
    setTouched(true);
    const next = { ...fields, ...patch };
    setFields(next);
    if (!autoSubmit) return;
    const answer = answerOf(next);
    if (answer) onSubmit(answer);
  };

  return {
    ...fields,
    han,
    score,
    scoreFromKo,
    scoreFromOya,
    koTsumoPayment: selection.koTsumoPayment,
    setHan: update("han"),
    setFu: update("fu"),
    setYakus: update("yakus"),
    setScore: (value) => selectScore({ score: value }),
    setScoreFromKo: (value) => selectScore({ scoreFromKo: value }),
    setScoreFromOya: (value) => selectScore({ scoreFromOya: value }),
    setKoTsumoPayment: ({ fromKo, fromOya }) =>
      selectScore({ scoreFromKo: fromKo, scoreFromOya: fromOya }),
    isFuRequired,
    availableScores,
    isOyaTsumo: paymentKindOf(isOya, isTsumo) === "oyaTsumo",
    isComplete,
    submit,
    showsSubmitButton: !autoSubmit,
  };
}
