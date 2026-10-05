import { MANGAN_MIN_HAN } from "@mahjong-scoring/core";
import {
  PRACTICE_SLUG,
  resolvePracticeVariant,
} from "@mahjong-scoring/features/practice-menu-types";
import { SCORE_TABLE_VARIANT_OPTIONS } from "@mahjong-scoring/features/practice/score-table/variants";

import { useRouteVariant } from "../../screens/use-route-variant";
import { ScoreTablePrompt } from "./score-table-prompt";

/** 代表値のデモに使う満貫未満のセル（子・ロン・3翻30符） */
const NON_MANGAN_DEMO = { han: 3, fu: 30 } as const;

/**
 * 点数表早引き練習の「問題方式」ビジュアルデモ
 * 点数表 遊び方デモ
 *
 * web の `ScoreTableHowToPlay` の移植。実際の出題（親子・ツモロン・翻・符の
 * 提示）を静的に再現する。何を見せるかは URL のバリアントの絞り込みから
 * 導く — 親だけのバリアントでは親、満貫以上だけのバリアントでは符の無い
 * 満貫の例。どちらでもないバリアントは代表値（子・ロン・3翻30符）。
 */
export function ScoreTableHowToPlay() {
  const variant = resolvePracticeVariant(
    PRACTICE_SLUG.scoreTable,
    useRouteVariant(PRACTICE_SLUG.scoreTable),
  );
  const { roles, ranges } = SCORE_TABLE_VARIANT_OPTIONS[variant];
  const isOya = roles?.length === 1 && roles[0] === "oya";
  // 満貫以上だけの出題は符を持たない（点数が符に依存しないため）
  const isManganPlusOnly = ranges?.includes("nonMangan") !== true;

  return (
    <ScoreTablePrompt
      isOya={isOya}
      isTsumo={false}
      han={isManganPlusOnly ? MANGAN_MIN_HAN : NON_MANGAN_DEMO.han}
      fu={isManganPlusOnly ? undefined : NON_MANGAN_DEMO.fu}
    />
  );
}
