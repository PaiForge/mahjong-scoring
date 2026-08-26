"use client";

import { useMemo } from "react";
import type { HaiKindId, Kazehai, Tehai } from "@mahjong-scoring/core";
import { TehaiDisplay } from "../../_components/tehai-display";
import type { TehaiContext } from "../../_components/tehai-display";

/**
 * 手牌表示に必要な出題データの表示専用サブセット
 * 出題表示データ
 *
 * `ScoreQuestion` はこの型を構造的に満たすためそのまま渡せる。別型に
 * している理由は結果ページでの再表示: sessionStorage から復元した出題は
 * ブランド型（Tehai14）と正解データ（answer）を持たないが、描画には
 * どちらも不要なため、描画が実際に読む形だけをここで要求する。
 */
export interface ScoreQuestionDisplayData {
  /** 手牌（和了牌を含む。純手牌 + 副露） */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  /** 和了牌 */
  readonly agariHai: HaiKindId;
  /** ツモ和了かどうか */
  readonly isTsumo: boolean;
  /** 自風 */
  readonly jikaze: Kazehai;
  /** 場風 */
  readonly bakaze: Kazehai;
  /**
   * ドラ表示牌
   *
   * 表示牌のまま出すか、ドラそのものへ読み替えて出すかは表示設定で決まる。
   */
  readonly doraMarkers: readonly HaiKindId[];
  /** リーチ有無 */
  readonly isRiichi?: boolean;
  /** 裏ドラ表示牌 */
  readonly uraDoraMarkers?: readonly HaiKindId[];
}

interface QuestionDisplayProps {
  readonly question: ScoreQuestionDisplayData;
}

/**
 * 点数計算系の出題表示
 * 問題表示
 *
 * 盤面そのものは全練習共通の {@link TehaiDisplay} に委譲する。この層は
 * 点数計算系の出題データ（{@link ScoreQuestionDisplayData}）を盤面の
 * コンテキストへ移し替えるだけで、見た目は持たない。
 */
export function QuestionDisplay({ question }: QuestionDisplayProps) {
  const context = useMemo<TehaiContext>(
    () => ({
      bakaze: question.bakaze,
      jikaze: question.jikaze,
      agariHai: question.agariHai,
      isTsumo: question.isTsumo,
      isRiichi: question.isRiichi,
      doraMarkers: question.doraMarkers,
      uraDoraMarkers: question.uraDoraMarkers,
    }),
    [question],
  );

  return <TehaiDisplay tehai={question.tehai} context={context} />;
}
