"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { ScoreTableUserAnswer } from "@mahjong-scoring/core";
import { getAvailableScores } from "../score/_lib/get-available-scores";
import { getSelectClass } from "../_lib/select-class";

interface ScoreAnswerFormProps {
  /** 親かどうか */
  readonly isOya: boolean;
  /** ツモかどうか */
  readonly isTsumo: boolean;
  /** 翻数 */
  readonly han: number;
  /** フォームリセット用のキー（変わるたびにフォームがリセットされる） */
  readonly questionKey: string | number;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
  /** i18n の翻訳ネームスペース */
  readonly translationNamespace: string;
  /** 満貫以上の点数のみ表示する */
  readonly manganOnly?: boolean;
  /**
   * 選択完了時に自動送信する（「回答する」ボタンを押さずに送信扱いにする）。
   * 単一選択は値が選ばれた時点、子ツモは2つとも選ばれた時点で送信する。
   * 有効時は送信ボタンを表示しない。
   */
  readonly autoSubmit?: boolean;
}

/**
 * 点数系練習共通の回答フォーム
 * 点数回答フォーム
 *
 * 点数のみを select で回答する。翻・符・親子・ツモロンの判定は呼び出し元が行う。
 */
export function ScoreAnswerForm({
  isOya,
  isTsumo,
  han,
  questionKey,
  onSubmit,
  disabled = false,
  translationNamespace,
  manganOnly,
  autoSubmit = false,
}: ScoreAnswerFormProps) {
  const t = useTranslations(translationNamespace);
  const [score, setScore] = useState<string>("");
  const [scoreFromKo, setScoreFromKo] = useState<string>("");
  const [scoreFromOya, setScoreFromOya] = useState<string>("");

  const isKoTsumo = isTsumo && !isOya;
  const isOyaTsumo = isTsumo && isOya;

  const availableScores = getAvailableScores(han, isOya, isTsumo, manganOnly);

  // 問題が変わったときにフォームをリセットする
  useEffect(() => {
    setScore("");
    setScoreFromKo("");
    setScoreFromOya("");
  }, [questionKey]);

  // 単一選択（ロン / 親ツモ）の値から回答を送信する
  const submitSingle = (value: string) => {
    const scoreNum = parseInt(value, 10);
    if (isNaN(scoreNum)) return;
    onSubmit(
      isOyaTsumo
        ? { type: "oyaTsumo", scoreAll: scoreNum }
        : { type: "ron", score: scoreNum },
    );
  };

  // 子ツモの2値から回答を送信する
  const submitKoTsumo = (koValue: string, oyaValue: string) => {
    const koScore = parseInt(koValue, 10);
    const oyaScore = parseInt(oyaValue, 10);
    if (isNaN(koScore) || isNaN(oyaScore)) return;
    onSubmit({ type: "koTsumo", scoreFromKo: koScore, scoreFromOya: oyaScore });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isKoTsumo) {
      submitKoTsumo(scoreFromKo, scoreFromOya);
    } else {
      submitSingle(score);
    }
  };

  const handleSingleChange = (value: string) => {
    setScore(value);
    if (autoSubmit && !disabled && value !== "") submitSingle(value);
  };

  const handleKoChange = (value: string) => {
    setScoreFromKo(value);
    if (autoSubmit && !disabled && value !== "" && scoreFromOya !== "") {
      submitKoTsumo(value, scoreFromOya);
    }
  };

  const handleOyaChange = (value: string) => {
    setScoreFromOya(value);
    if (autoSubmit && !disabled && value !== "" && scoreFromKo !== "") {
      submitKoTsumo(scoreFromKo, value);
    }
  };

  const selectClass = getSelectClass;

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
                onChange={(e) => handleKoChange(e.target.value)}
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
                onChange={(e) => handleOyaChange(e.target.value)}
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
            onChange={(e) => handleSingleChange(e.target.value)}
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

      {/* 自動送信時は「回答する」ボタンを表示しない（選択完了で送信扱い） */}
      {!autoSubmit && (
        <button
          type="submit"
          disabled={disabled}
          className="w-full rounded-lg bg-primary-500 py-3 px-6 font-bold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-surface-400 disabled:text-surface-200"
        >
          {t("answer")}
        </button>
      )}
    </form>
  );
}
