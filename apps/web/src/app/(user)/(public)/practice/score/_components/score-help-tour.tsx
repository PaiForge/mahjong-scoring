"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { generateValidScoreQuestion, isOya } from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  UserAnswer,
  JudgementResult,
} from "@mahjong-scoring/core";
import { QuestionDisplay } from "./question-display";
import { ScorePracticeAnswerForm } from "./score-practice-answer-form";
import { ResultDisplay } from "./result-display";

/**
 * 点数計算総合演習 ヘルプツアー
 *
 * @description
 * 設定画面の PageTitle 右端に置く「?」ボタン。押すと、初回利用者向けに
 * 「開始する」後のプレイ画面（問題 → 回答 → 結果）を実コンポーネントで
 * プレビューするカルーセルモーダルを開く。スクリーンショットではなく実物を
 * 描画するため、UI 変更に自動追従する。
 *
 * @flow
 * 1. PageTitle の「?」ボタンを押すとモーダルが開く（初回開封時にサンプル問題を生成）
 * 2. 問題画面・回答画面・結果画面の3スライドを「戻る/次へ」で閲覧
 * 3. 「閉じる」またはオーバーレイクリック / Esc で終了
 */

const noop = () => {};

/**
 * 子要素の自然幅が枠を超える場合だけ、transform で縮小して横幅に収めるラッパー。
 * 牌は固定サイズ画像で xs より小さい区分が無いため、狭い画面（モーダル幅）でも
 * 手牌がはみ出さないよう、最後の調整としてスケールで吸収する。等倍時は無変化。
 */
function FitToWidth({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const measure = () => {
      const available = outer.clientWidth;
      if (available === 0) return;
      // 手牌は justify-center で左右対称にはみ出すため、scrollWidth（右側のはみ出しのみ）
      // では実幅を過小評価する。中央対称を前提に実コンテンツ幅を復元する。
      const natural = 2 * inner.scrollWidth - available;
      // 緑ブロック自身の左右パディング(各8px)＋牌が枠に触れない余白を見込んで
      // 固定ピクセルで内側に収める（比率だと狭幅でパディングを食い込む）。
      const target = Math.max(0, available - 24);
      const next = natural > target && target > 0 ? target / natural : 1;
      setScale(next);
      // transform はレイアウト高さを変えないため、縮小分を高さに反映して余白を防ぐ
      setHeight(inner.offsetHeight * next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outerRef} className="overflow-hidden" style={{ height }}>
      <div
        ref={innerRef}
        className="w-full"
        style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
      >
        {children}
      </div>
    </div>
  );
}

/** 正解の点数計算結果から「全問正解」のユーザー回答を組み立てる（結果スライド用） */
function buildCorrectAnswer(answer: ScoreQuestion["answer"]): UserAnswer {
  const { han, fu, payment } = answer;
  if (payment.type === "koTsumo") {
    return {
      han,
      fu,
      scoreFromKo: payment.amount[0],
      scoreFromOya: payment.amount[1],
      yakus: [],
    };
  }
  // ron / oyaTsumo はどちらも単一の点数
  return { han, fu, score: payment.amount, yakus: [] };
}

const ALL_CORRECT: JudgementResult = {
  isCorrect: true,
  isHanCorrect: true,
  isFuCorrect: true,
  isScoreCorrect: true,
  isYakuCorrect: true,
};

export function ScoreHelpTour() {
  const t = useTranslations("score");
  const tCommon = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);
  // 副露なしの分かりやすいサンプルを初回開封時に1度だけ生成して固定する。
  const [sample, setSample] = useState<ScoreQuestion | undefined>(undefined);

  const open = useCallback(() => {
    setSample((prev) =>
      prev ??
      generateValidScoreQuestion({ includeFuro: false, includeChiitoi: false }),
    );
    setIndex(0);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const slides = useMemo(() => {
    if (!sample) return [];
    return [
      {
        key: "question",
        title: t("help.slides.question.title"),
        caption: t("help.slides.question.caption"),
        node: (
          <div className="rounded-xl border border-surface-200 bg-white p-2">
            {/* 牌サイズは xs 固定 + 狭い画面でも収まるよう FitToWidth で最終調整 */}
            <FitToWidth>
              <QuestionDisplay question={sample} size="xs" />
            </FitToWidth>
          </div>
        ),
      },
      {
        key: "answer",
        title: t("help.slides.answer.title"),
        caption: t("help.slides.answer.caption"),
        node: (
          <div className="rounded-xl border border-surface-200 bg-white p-4 sm:p-6">
            <ScorePracticeAnswerForm
              onSubmit={noop}
              disabled
              isTsumo={sample.isTsumo}
              isOya={isOya(sample.jikaze)}
            />
          </div>
        ),
      },
      {
        key: "result",
        title: t("help.slides.result.title"),
        caption: t("help.slides.result.caption"),
        node: (
          <div className="rounded-xl border border-surface-200 bg-white p-4 sm:p-6">
            <ResultDisplay
              question={sample}
              userAnswer={buildCorrectAnswer(sample.answer)}
              result={ALL_CORRECT}
              onNext={noop}
            />
          </div>
        ),
      },
    ];
  }, [sample, t]);

  const total = slides.length;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(
    () => setIndex((i) => Math.min(total - 1, i + 1)),
    [total],
  );

  // Esc で閉じる & 背面スクロールをロック
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  const current = slides[index];

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={t("help.label")}
        className="text-surface-400 transition-colors hover:text-surface-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.94 6.94a1.5 1.5 0 112.12 2.12c-.2.2-.42.36-.64.5-.42.28-.92.6-.92 1.19v.25a.75.75 0 001.5 0c0-.04.02-.08.06-.11.16-.13.36-.26.56-.39.32-.21.68-.46.98-.76a3 3 0 10-5.12-2.12.75.75 0 001.5 0c0-.21.06-.41.16-.58zM10 14.5a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={t("help.title")}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-200 px-5 py-3">
              <h3 className="text-base font-bold text-surface-900">
                {t("help.title")}
              </h3>
              <button
                type="button"
                onClick={close}
                aria-label={tCommon("close")}
                className="text-surface-400 transition-colors hover:text-surface-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            {/* Body: 見出しは px-5、スライド本体は px-2 にして牌の使える幅を最大化する */}
            <div className="overflow-y-auto py-4">
              <div className="px-5">
                <p className="mb-1 text-sm font-bold text-surface-700">
                  {current.title}
                </p>
                <p className="mb-4 text-sm text-surface-500">{current.caption}</p>
              </div>
              <div className="overflow-x-auto px-2">{current.node}</div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-surface-200 px-5 py-3">
              <button
                type="button"
                onClick={goPrev}
                disabled={isFirst}
                className="rounded-lg px-4 py-2 text-sm font-bold text-surface-600 transition-colors hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("help.prev")}
              </button>

              <div className="flex items-center gap-2" aria-hidden>
                {slides.map((s, i) => (
                  <span
                    key={s.key}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      i === index ? "bg-primary-500" : "bg-surface-300"
                    }`}
                  />
                ))}
              </div>

              {isLast ? (
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-600"
                >
                  {tCommon("close")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-600"
                >
                  {t("help.next")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
