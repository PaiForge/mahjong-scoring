import { parseHais } from "@mahjong-scoring/core";
import type {
  CompletedMentsu,
  HaiKindId,
  MentsuType,
} from "@mahjong-scoring/core";
import { buildMentsu } from "../../results/mentsu-serialization";
import type { MentsuJantouFuItemResult } from "./types";

/**
 * 復元した回答行（出題中の行と同じ形で描くための最小限）
 * 復元回答行
 */
export interface RestoredItem {
  readonly id: string;
  readonly tiles: readonly HaiKindId[];
  readonly type: MentsuType | "Pair";
  readonly isOpen: boolean;
  readonly originalMentsu?: CompletedMentsu;
  readonly correctFu: number;
  /** ユーザーが選んだ符。時間切れで答えられなかった問題では持たない */
  readonly userFu?: number;
}

/**
 * 保存された回答行を、出題中と同じ体裁で描ける形に戻す
 * 回答行復元
 *
 * @param item 結果データに保存された回答行
 * @param index 行の並び順（和了牌ハイライトの突き合わせ用の id になる）
 */
export function restoreItem(
  item: MentsuJantouFuItemResult,
  index: number,
): RestoredItem {
  const tiles = parseHais(item.tiles);
  return {
    // 和了牌ハイライトの突き合わせにしか使わないため、並び順から採番する
    id: String(index),
    tiles,
    type: item.type,
    isOpen: item.isOpen,
    // 雀頭は面子ではないため晒す表示を持たない（牌を平らに並べる）
    originalMentsu:
      item.type === "Pair"
        ? undefined
        : buildMentsu(item.type, tiles, item.furo),
    correctFu: item.correctFu,
    userFu: item.userFu,
  };
}
