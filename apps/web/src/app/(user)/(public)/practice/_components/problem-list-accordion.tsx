"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { AccordionCard } from "@/app/(user)/_components/accordion-card";
import { ClockIcon } from "@/app/(user)/_components/icons/clock-icon";
import { AnswerOutcome } from "@mahjong-scoring/features/results/result-schemas";
import { registerMistakeReveal } from "../_lib/mistake-reveal";
import { JudgementMark } from "./judgement-mark";

interface ProblemListAccordionProps<T> {
  readonly results: readonly T[];
  /** i18n の翻訳ネームスペース（result.problemDetails, result.correct, result.incorrect を含む） */
  readonly translationNamespace: string;
  /** 1 問の顛末（正解・不正解・時間切れ）を取り出す関数 */
  readonly outcome: (result: T) => AnswerOutcome;
  /** ヘッダー右側に表示するサマリーテキスト（任意） */
  readonly renderSummary?: (result: T, index: number) => ReactNode;
  /** 展開時の詳細コンテンツ */
  readonly renderDetail: (result: T, index: number) => ReactNode;
}

/**
 * 練習共通の問題別アコーディオン一覧
 * 問題一覧アコーディオン
 *
 * 各問を `AccordionCard` で折りたたみ表示し、正誤アイコンとカスタマイズ可能な
 * 詳細セクションを提供する。
 *
 * 時間切れで答えられなかった問題（時間切れのチャレンジの最後の 1 問）も
 * 同じ一覧に載せ、答えを見られるようにする。ただし右端は正誤の記号と色を
 * 使わず、灰色の時計と「時間切れ」にする — 解けなかったことと間違えたことは
 * 別で、✗ を付けると不正解の数を数え違える。
 *
 * 「結果」節の {@link import("./reveal-mistakes-link").RevealMistakesLink} から
 * 呼ばれると、間違えた問題（不正解と時間切れ）をすべて開き、その先頭へ
 * スクロールする。各問は既定で閉じているので、開かずに送ると閉じたカードの
 * 列に着地するだけで、どれを読めばよいかが分からない。時間切れも開くのは、
 * 答えを確かめたい問題であることは不正解と同じだから。開いた後は各カードを
 * 普段どおり押して閉じられる。
 */
export function ProblemListAccordion<T>({
  results,
  translationNamespace,
  outcome: outcomeOf,
  renderSummary,
  renderDetail,
}: ProblemListAccordionProps<T>) {
  const tResult = useTranslations(`${translationNamespace}.result`);
  const tCommon = useTranslations("common");
  const idPrefix = useId();
  const [openIndexes, setOpenIndexes] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  // 開いた後のスクロール先。開いてから描画が済むまで待つため state で運ぶ
  // （同じ問題へもう一度送れるよう、押すたびに新しいオブジェクトにする）
  const [scrollTarget, setScrollTarget] = useState<{ index: number }>();

  const missedIndexes = results.flatMap((result, index) =>
    outcomeOf(result) === AnswerOutcome.Correct ? [] : [index],
  );
  const firstMissed = missedIndexes[0];
  // 依存配列に載せるため、配列ではなく文字列で比べる
  const missedKey = missedIndexes.join(",");

  useEffect(() => {
    if (firstMissed === undefined) return;
    const indexes = missedKey.split(",").map(Number);
    return registerMistakeReveal(() => {
      setOpenIndexes((prev) => new Set([...prev, ...indexes]));
      setScrollTarget({ index: firstMissed });
    });
  }, [firstMissed, missedKey]);

  useEffect(() => {
    if (scrollTarget === undefined) return;
    document
      .getElementById(`${idPrefix}-${scrollTarget.index}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [idPrefix, scrollTarget]);

  if (results.length === 0) return undefined;

  return (
    <div className="mt-8 w-full space-y-2">
      <p className="text-left text-sm font-medium text-surface-500">
        {tResult("problemDetails")}
      </p>
      <div className="space-y-2">
        {results.map((result, index) => {
          const outcome = outcomeOf(result);

          return (
            <div
              key={index}
              id={`${idPrefix}-${index}`}
              className="scroll-mt-24"
            >
              <AccordionCard
                open={openIndexes.has(index)}
                onOpenChange={(open) =>
                  setOpenIndexes((prev) => {
                    const next = new Set(prev);
                    if (open) next.add(index);
                    else next.delete(index);
                    return next;
                  })
                }
                title={
                  <>
                    <span className="font-medium whitespace-nowrap">
                      No.{index + 1}
                    </span>
                    {renderSummary && (
                      <span className="text-sm text-surface-500">
                        {renderSummary(result, index)}
                      </span>
                    )}
                  </>
                }
                trailing={
                  outcome === AnswerOutcome.TimeUp ? (
                    // 正誤ではないので中立色。時計は「時間が来た」の印
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-surface-500">
                      <ClockIcon className="size-[1em] shrink-0" />
                      {tCommon("timeUp")}
                    </span>
                  ) : (
                    // 記号と語を同じ色で並べる（語が正誤を言うので記号は装飾）
                    <span
                      className={`inline-flex items-center gap-1 text-sm font-medium ${outcome === AnswerOutcome.Correct ? "text-success" : "text-destructive"}`}
                    >
                      <JudgementMark verdict={outcome} tone="inherit" />
                      {outcome === AnswerOutcome.Correct
                        ? tResult("correct")
                        : tResult("incorrect")}
                    </span>
                  )
                }
              >
                {renderDetail(result, index)}
              </AccordionCard>
            </div>
          );
        })}
      </div>
    </div>
  );
}
