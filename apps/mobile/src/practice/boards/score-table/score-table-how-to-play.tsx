import {
  PRACTICE_SLUG,
  resolvePracticeVariant,
} from "@mahjong-scoring/features/practice-menu-types";
import { scoreTableDemoPromptOf } from "@mahjong-scoring/features/practice/score-table/variants";

import { useRouteVariant } from "../../screens/use-route-variant";
import { ScoreTablePrompt } from "./score-table-prompt";

/**
 * 点数表早引き練習の「問題方式」ビジュアルデモ
 * 点数表 遊び方デモ
 *
 * web の `ScoreTableHowToPlay` の移植。実際の出題（親子・ツモロン・翻・符の
 * 提示）を静的に再現する。何を見せるかは URL のバリアントから
 * {@link scoreTableDemoPromptOf} が決める（web と同じ例になる）。
 */
export function ScoreTableHowToPlay() {
  const variant = resolvePracticeVariant(
    PRACTICE_SLUG.scoreTable,
    useRouteVariant(PRACTICE_SLUG.scoreTable),
  );
  const { isOya, han, fu } = scoreTableDemoPromptOf(variant);

  return <ScoreTablePrompt isOya={isOya} isTsumo={false} han={han} fu={fu} />;
}
