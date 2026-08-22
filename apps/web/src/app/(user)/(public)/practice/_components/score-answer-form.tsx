"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ScoreTableUserAnswer } from "@mahjong-scoring/core";
import { Button } from "@/app/(user)/_components/button";
import { getAvailableScores } from "../score/_lib/get-available-scores";
import { ScoreOptionSelect } from "./score-option-select";

interface ScoreAnswerFormProps {
  /** 親かどうか */
  readonly isOya: boolean;
  /** ツモかどうか */
  readonly isTsumo: boolean;
  /** 翻数 */
  readonly han: number;
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
 *
 * @remarks
 * 問題が変わったときの入力リセットは、呼び出し元が `key` に問題の識別子を
 * 渡して再マウントさせることで行う（`useEffect` での state リセットはしない）。
 */
export function ScoreAnswerForm({
  isOya,
  isTsumo,
  han,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {availableScores.type === "koTsumo" ? (
        <div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-bold text-surface-700">
                {t("fromKo")}
              </label>
              <ScoreOptionSelect
                value={scoreFromKo}
                onChange={handleKoChange}
                options={availableScores.koScores}
                placeholder={t("selectScore")}
                disabled={disabled}
              />
            </div>
            <span className="mt-6 font-medium text-surface-500">/</span>
            <div className="flex-1">
              <label className="mb-2 block text-sm font-bold text-surface-700">
                {t("fromOya")}
              </label>
              <ScoreOptionSelect
                value={scoreFromOya}
                onChange={handleOyaChange}
                options={availableScores.oyaScores}
                placeholder={t("selectScore")}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-2 block text-sm font-bold text-surface-700">
            {t("selectScore")}
          </label>
          <ScoreOptionSelect
            value={score}
            onChange={handleSingleChange}
            options={availableScores.scores}
            placeholder={t("selectScore")}
            disabled={disabled}
            optionSuffix={isOyaTsumo ? t("all") : ""}
          />
        </div>
      )}

      {/* 自動送信時は「回答する」ボタンを表示しない（選択完了で送信扱い） */}
      {!autoSubmit && (
        <Button type="submit" size="lg" fullWidth disabled={disabled}>
          {t("answer")}
        </Button>
      )}
    </form>
  );
}
