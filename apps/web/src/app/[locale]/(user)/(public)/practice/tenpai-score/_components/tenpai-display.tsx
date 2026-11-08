"use client";

import { useMemo } from "react";
import type { ComponentProps } from "react";
import type { TenpaiScoreQuestion } from "@mahjong-scoring/core";
import { TehaiDisplay } from "../../_components/tehai-display";
import type { TehaiContext } from "@mahjong-scoring/features/board/tehai-context";

interface TenpaiDisplayProps {
  readonly question: TenpaiScoreQuestion;
  /**
   * 裏ドラ表示牌を見せるか。待ち牌を答えるまでは伏せておき、点数を答える
   * 段階で開く（裏ドラは和了して初めてめくるものなので、待ちを読む間は
   * 見えていない方が実戦に近い）
   */
  readonly showUraDora: boolean;
  /** モバイルでの盤面の広げ方（{@link TehaiDisplay} にそのまま渡す） */
  readonly mobileFrame?: ComponentProps<typeof TehaiDisplay>["mobileFrame"];
  /** ヘルプツアーの対象 ID（{@link TehaiDisplay} にそのまま渡す） */
  readonly tourId?: string;
}

/**
 * 聴牌形の出題表示
 * 聴牌形表示
 *
 * 盤面は全練習共通の {@link TehaiDisplay} に委譲する。和了牌とツモ・ロンは
 * まだ無いので渡さない（13 枚すべてが純手牌として並び、理牌しない設定ならその 13 枚を
 * 並べ直す）。待ち牌の選択・点数のマス・答え合わせの段階へ進んでも問題の手牌は
 * 変わらず、裏ドラを開いても並びは変わらない（並びの種はドラを含まない）。
 */
export function TenpaiDisplay({
  question,
  showUraDora,
  mobileFrame,
  tourId,
}: TenpaiDisplayProps) {
  const context = useMemo<TehaiContext>(
    () => ({
      bakaze: question.bakaze,
      jikaze: question.jikaze,
      isRiichi: question.isRiichi,
      doraMarkers: question.doraMarkers,
      uraDoraMarkers: showUraDora ? question.uraDoraMarkers : undefined,
    }),
    [question, showUraDora],
  );

  return (
    <TehaiDisplay
      tehai={question.tehai}
      context={context}
      mobileFrame={mobileFrame}
      tourId={tourId}
    />
  );
}
