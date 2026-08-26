import type {
  Tehai14,
  HaiKindId,
  MentsuType,
  CompletedMentsu,
} from "@pai-forge/riichi-mahjong";
import type { AgariContext } from "../shared/agari-context";

/**
 * 符を答える対象となる手牌の構成要素（面子1つ、または雀頭）
 * 面子・雀頭符要素
 */
export interface MentsuJantouFuItem {
  readonly id: string;
  readonly tiles: readonly HaiKindId[];
  readonly type: MentsuType | "Pair";
  readonly fu: number;
  readonly originalMentsu?: CompletedMentsu;
  readonly isOpen: boolean;
}

/**
 * 手牌のすべての面子と雀頭について、要素ごとの符を問う問題
 * 面子・雀頭符問題
 */
export interface MentsuJantouFuQuestion {
  readonly id: string;
  readonly tehai: Tehai14;
  readonly context: AgariContext;
  readonly items: readonly MentsuJantouFuItem[];
}
