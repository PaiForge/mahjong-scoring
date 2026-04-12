import type { HaiKindId } from "@pai-forge/riichi-mahjong";

/**
 * 待ちの符計算問題（MachiFu question）
 * 待ち符計算練習の1問分のデータ
 */
export interface MachiFuQuestion {
  id: string;
  /** 待ち形を構成する牌 */
  tiles: readonly HaiKindId[];
  /** 和了牌 */
  agariHai: HaiKindId;
  /** 正解の符（0 or 2） */
  answer: number;
  /** 待ちの形の名称（例: "両面待ち"） */
  shapeName: string;
  /** 解説テキスト（例: "両面待ちは0符です"） */
  explanation: string;
}
