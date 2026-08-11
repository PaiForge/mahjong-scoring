import type {
  Tehai14,
  HaiKindId,
  MentsuType,
  CompletedMentsu,
} from "@pai-forge/riichi-mahjong";
import type { AgariContext } from "../shared/agari-context";

/**
 * 手牌の符計算における個別の構成要素
 * 手牌符要素
 */
export interface TehaiFuItem {
  readonly id: string;
  readonly tiles: readonly HaiKindId[];
  readonly type: MentsuType | "Pair";
  readonly fu: number;
  readonly explanation: string;
  readonly originalMentsu?: CompletedMentsu;
  readonly isOpen: boolean;
}

/**
 * 手牌の符計算問題
 * 手牌符問題
 */
export interface TehaiFuQuestion {
  readonly id: string;
  readonly tehai: Tehai14;
  readonly context: AgariContext;
  readonly items: readonly TehaiFuItem[];
}
