"use client";

import { useMemo } from "react";
import type { HaiKindId, Tehai } from "@mahjong-scoring/core";
import { TehaiDisplay } from "../../_components/tehai-display";
import type { TehaiContext } from "../../_components/tehai-display";

/**
 * 手牌表示に必要な出題データの表示専用サブセット
 * 出題表示データ
 *
 * 盤面のコンテキスト（{@link TehaiContext}）に手牌を足した平坦な形。
 * `ScoreQuestion` はこの型を構造的に満たすためそのまま渡せる。別型に
 * している理由は結果ページでの再表示: sessionStorage から復元した出題は
 * ブランド型（Tehai14）と正解データ（answer）を持たないが、描画には
 * どちらも不要なため、描画が実際に読む形だけをここで要求する。
 */
export interface ScoreQuestionDisplayData extends TehaiContext {
  /** 手牌（和了牌を含む。純手牌 + 副露） */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  /** ドラ表示牌。点数計算の出題では必須 */
  readonly doraMarkers: readonly HaiKindId[];
}

interface QuestionDisplayProps {
  readonly question: ScoreQuestionDisplayData;
}

/**
 * 点数計算系の出題表示
 * 問題表示
 *
 * 盤面そのものは全練習共通の {@link TehaiDisplay} に委譲する。この層は
 * 平坦な出題データから手牌と盤面コンテキストを切り分けるだけで、
 * 見た目は持たない。
 */
export function QuestionDisplay({ question }: QuestionDisplayProps) {
  const context = useMemo<TehaiContext>(() => {
    const { tehai: _tehai, ...rest } = question;
    return rest;
  }, [question]);

  return <TehaiDisplay tehai={question.tehai} context={context} />;
}
