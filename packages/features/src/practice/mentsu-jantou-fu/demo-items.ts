import { HaiKind, MentsuType } from "@mahjong-scoring/core";
import { DEMO_FU_CONTEXT } from "../../board/demo-tehai";
import { findAgariHighlight } from "./find-agari-highlight";
import type { AgariHighlightItem } from "./find-agari-highlight";

/**
 * 面子と雀頭の符練習の遊び方デモで並べる行
 * 面子雀頭符デモ行
 *
 * 符の練習の共通デモ牌姿（`DEMO_FU_TEHAI`）を要素に分けたもの。
 * 234m / 567p / 中中中(暗刻) / 678s / 南南(雀頭)
 */
export const MENTSU_JANTOU_FU_DEMO_ITEMS: readonly AgariHighlightItem[] = [
  {
    id: "234m",
    tiles: [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4],
    type: MentsuType.Shuntsu,
    isOpen: false,
  },
  {
    id: "567p",
    tiles: [HaiKind.PinZu5, HaiKind.PinZu6, HaiKind.PinZu7],
    type: MentsuType.Shuntsu,
    isOpen: false,
  },
  {
    id: "chun",
    tiles: [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun],
    type: MentsuType.Koutsu,
    isOpen: false,
  },
  {
    id: "678s",
    tiles: [HaiKind.SouZu6, HaiKind.SouZu7, HaiKind.SouZu8],
    type: MentsuType.Shuntsu,
    isOpen: false,
  },
  {
    id: "nan",
    tiles: [HaiKind.Nan, HaiKind.Nan],
    type: "Pair",
    isOpen: false,
  },
];

/**
 * デモの和了牌（七筒ツモ）を示す位置
 * 面子雀頭符デモ和了牌位置
 *
 * 出題盤面と同じ判定（{@link findAgariHighlight}）から求める。
 */
export const MENTSU_JANTOU_FU_DEMO_AGARI_HIGHLIGHT = findAgariHighlight(
  MENTSU_JANTOU_FU_DEMO_ITEMS,
  DEMO_FU_CONTEXT.agariHai,
);
