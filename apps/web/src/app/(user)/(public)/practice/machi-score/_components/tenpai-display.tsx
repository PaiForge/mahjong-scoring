"use client";

import { useMemo } from "react";
import type { ComponentProps } from "react";
import type { MachiScoreQuestion } from "@mahjong-scoring/core";
import { TehaiDisplay } from "../../_components/tehai-display";
import type { TehaiContext } from "../../_components/tehai-display";

interface TenpaiDisplayProps {
  readonly question: MachiScoreQuestion;
  /**
   * 裏ドラ表示牌を見せるか。待ち牌を答えるまでは伏せておき、点数を答える
   * 段階で開く（裏ドラは和了して初めてめくるものなので、待ちを読む間は
   * 見えていない方が実戦に近い）
   */
  readonly showUraDora: boolean;
  /** モバイルでの盤面の広げ方（{@link TehaiDisplay} にそのまま渡す） */
  readonly mobileFrame?: ComponentProps<typeof TehaiDisplay>["mobileFrame"];
}

/**
 * 聴牌形の出題表示
 * 聴牌形表示
 *
 * 盤面は全練習共通の {@link TehaiDisplay} に委譲する。和了牌とツモ・ロンは
 * まだ無いので渡さない（13 枚が理牌されて並ぶ）。
 */
export function TenpaiDisplay({
  question,
  showUraDora,
  mobileFrame,
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
    />
  );
}
