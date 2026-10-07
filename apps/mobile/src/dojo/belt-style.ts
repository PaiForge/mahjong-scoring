import type { ViewStyle } from "react-native";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

import { RANK_BELT_COLORS } from "../lib/belt-colors";
import { panelFrame } from "../lib/panel-styles";
import { colors } from "../lib/theme";

/** 段級位（無級を含む）の帯色一式 */
interface BeltStyle {
  /** 帯そのものの色（バッジの円・見出しの pill） */
  readonly fill: string;
  /** 帯色でカードを縁取るときの枠 */
  readonly border: string;
  /** 帯色の淡い面 */
  readonly tint: string;
  /** 淡い面に載せる文字 */
  readonly tintText: string;
  /** 帯そのものの色に載せる文字・紋章 */
  readonly foreground: string;
}

/** 無級（web の `UNRANKED_BELT_CLASSES`）。淡いグレーの円を淡いグレーで縁取ると輪郭が消えるため枠を一段濃くする */
const UNRANKED: BeltStyle = {
  fill: colors.surface200,
  border: colors.surface300,
  tint: colors.surface100,
  tintText: colors.surface700,
  foreground: colors.surface500,
};

/**
 * 段級位の帯色を引く（未取得 = 無級は undefined）
 * 帯色解決
 *
 * web の `belt-colors.ts` の `beltClass` / `beltBorderClass` /
 * `beltTintClasses` / `beltForegroundClass` をまとめたもの。色の値は
 * `lib/belt-colors.ts` が持つ。
 */
export function beltStyle(slug: RankSlug | undefined): BeltStyle {
  if (slug === undefined) return UNRANKED;
  const belt = RANK_BELT_COLORS[slug];
  return {
    fill: belt.fill,
    border: belt.fill,
    tint: belt.tint,
    tintText: belt.tintText,
    foreground: colors.white,
  };
}

/**
 * 段級位のカードの枠（web の `rounded-panel border border-t-4 border-panel` + `beltBorderTopClass`）
 * 帯色カード枠
 *
 * 細い枠に、上端だけ帯色の帯を敷く。級名を掲げたカードを既定の緑で
 * 縁取ると緑がその級の色に見えるため、級の色は帯が持つ。
 */
export function beltCardFrame(slug: RankSlug | undefined): ViewStyle {
  return {
    ...panelFrame,
    borderTopWidth: 4,
    borderTopColor: beltStyle(slug).fill,
  };
}
