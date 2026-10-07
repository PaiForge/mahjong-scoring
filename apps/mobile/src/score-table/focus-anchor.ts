import type { RefObject } from "react";
import type { View } from "react-native";

/**
 * 注目セルの印（点数早見表の正解のセル）
 * 注目アンカー
 *
 * 表は注目セルの中身をこの ref と onLayout を持つ View で包む。置かれた
 * ことを `ScoreTable` が受け取り、スクロール枠の中央へ寄せる。
 */
export interface FocusAnchor {
  readonly ref: RefObject<View | null>;
  readonly onLayout: () => void;
}
