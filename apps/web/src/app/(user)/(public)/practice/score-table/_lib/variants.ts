import type { ScoreTableGeneratorOptions } from "@mahjong-scoring/core";
import type { PracticeVariantOf } from "@/lib/db/practice-menu-types";

/** バリアントが決める出題の絞り込み（親子・点数帯。ツモ/ロンは常に両方） */
export type ScoreTableVariantOptions = Pick<
  ScoreTableGeneratorOptions,
  "roles" | "ranges"
>;

/**
 * 点数表早引きのバリアント → 出題の絞り込み
 * 点数表バリアント表
 *
 * 軸はレジストリの列挙に固定する（親子 × 点数帯、それと「全部」）。
 * ツモ/ロンは絞らない — ロンとツモは同じセルの表裏で、片方だけ覚える練習は
 * 暗記の単位として不自然なため。「全部」は表の全体を引く完成形。
 *
 * レジストリにバリアントを足すとここが埋まるまでコンパイルエラーになる。
 */
export const SCORE_TABLE_VARIANT_OPTIONS: Readonly<
  Record<PracticeVariantOf<"score-table">, ScoreTableVariantOptions>
> = {
  ko_mangan_plus: { roles: ["ko"], ranges: ["manganPlus"] },
  oya_mangan_plus: { roles: ["oya"], ranges: ["manganPlus"] },
  ko_non_mangan: { roles: ["ko"], ranges: ["nonMangan"] },
  oya_non_mangan: { roles: ["oya"], ranges: ["nonMangan"] },
  all: { roles: ["oya", "ko"], ranges: ["nonMangan", "manganPlus"] },
};
